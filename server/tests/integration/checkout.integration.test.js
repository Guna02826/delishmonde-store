import crypto from "crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-jwt-secret";
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
process.env.NODE_ENV = "test";

const razorpayCreateMock = vi.fn();
const sendInvoiceEmailMock = vi.fn();

vi.mock("razorpay", () => {
  return {
    default: class Razorpay {
      constructor() {
        this.orders = {
          create: razorpayCreateMock,
        };
      }
    },
  };
});

vi.mock("../../utils/invoice.js", () => ({
  sendInvoiceEmail: sendInvoiceEmailMock,
}));

const { default: app } = await import("../../app.js");
const { connectTestDb, clearTestDb, disconnectTestDb } = await import("./helpers/testDb.js");
const { default: User } = await import("../../models/user.model.js");
const { default: Product } = await import("../../models/product.model.js");
const { default: Cart } = await import("../../models/cart.model.js");
const { default: Coupon } = await import("../../models/coupon.model.js");
const { default: Payment } = await import("../../models/payment.model.js");
const { default: Order } = await import("../../models/order.model.js");

const createUserAndSession = async ({ isAdmin = false } = {}) => {
  const email = isAdmin ? "admin@test.com" : "user@test.com";
  const hashedPassword = await bcrypt.hash("Password@123", 10);
  await User.create({
    username: isAdmin ? "Admin" : "User",
    email,
    password: hashedPassword,
    isAdmin,
  });

  const loginResponse = await request(app).post("/api/users/sessions").send({
    email,
    password: "Password@123",
  });

  const cookie = loginResponse.headers["set-cookie"]?.[0];
  expect(cookie).toBeTruthy();
  return { cookie };
};

const createCheckout = async ({ cookie, couponCode } = {}) => {
  const product = await Product.create({
    name: "Chocolate Cake",
    category: ["Cakes"],
    price: 100,
    stock: 10,
    description: "Fresh cake",
    images: ["https://example.com/cake.jpg"],
  });

  await Cart.create({
    userId: (await User.findOne({ email: "user@test.com" }))._id,
    items: [{ productId: product._id, quantity: 2 }],
  });

  razorpayCreateMock.mockResolvedValue({
    id: "order_rzp_123",
    amount: 20000,
    currency: "INR",
  });

  const response = await request(app)
    .post("/api/orders/create-razorpay-order")
    .set("Cookie", cookie)
    .send({
      items: [{ productId: product._id.toString(), quantity: 2 }],
      couponCode,
    });

  return { response, product };
};

const buildSignature = ({ orderId, paymentId }) =>
  crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  razorpayCreateMock.mockReset();
  sendInvoiceEmailMock.mockReset();
});

describe("Checkout integration", () => {
  it("verifies valid checkout and persists final order workflow", async () => {
    const { cookie } = await createUserAndSession();
    const { response, product } = await createCheckout({ cookie });

    expect(response.status).toBe(201);
    const paymentIntentId = response.body.orderId;

    const verifyResponse = await request(app)
      .post("/api/orders/verify-payment")
      .set("Cookie", cookie)
      .send({
        orderId: paymentIntentId,
        razorpay_order_id: response.body.razorpayOrderId,
        razorpay_payment_id: "pay_123",
        razorpay_signature: buildSignature({
          orderId: response.body.razorpayOrderId,
          paymentId: "pay_123",
        }),
      });

    expect(verifyResponse.status).toBe(200);

    const payment = await Payment.findById(paymentIntentId);
    const order = await Order.findById(payment.order);
    const updatedProduct = await Product.findById(product._id);
    const cart = await Cart.findOne({ userId: payment.user });

    expect(payment.status).toBe("completed");
    expect(order).toBeTruthy();
    expect(order.products[0].priceAtPurchase).toBe(100);
    expect(updatedProduct.stock).toBe(8);
    expect(cart.items).toHaveLength(0);
    expect(sendInvoiceEmailMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid signatures and avoids side effects", async () => {
    const { cookie } = await createUserAndSession();
    const { response, product } = await createCheckout({ cookie });
    const paymentIntentId = response.body.orderId;

    const verifyResponse = await request(app)
      .post("/api/orders/verify-payment")
      .set("Cookie", cookie)
      .send({
        orderId: paymentIntentId,
        razorpay_order_id: response.body.razorpayOrderId,
        razorpay_payment_id: "pay_bad",
        razorpay_signature: "invalid_signature",
      });

    expect(verifyResponse.status).toBe(400);

    const payment = await Payment.findById(paymentIntentId);
    const orders = await Order.find();
    const updatedProduct = await Product.findById(product._id);
    const cart = await Cart.findOne({ userId: payment.user });

    expect(payment.status).toBe("failed");
    expect(orders).toHaveLength(0);
    expect(updatedProduct.stock).toBe(10);
    expect(cart.items).toHaveLength(1);
    expect(sendInvoiceEmailMock).not.toHaveBeenCalled();
  });

  it("rolls back transaction when coupon usage update fails", async () => {
    const { cookie } = await createUserAndSession();
    await Coupon.create({
      code: "SAVE10",
      discountType: "fixed",
      value: 10,
      isActive: true,
    });

    const { response, product } = await createCheckout({ cookie, couponCode: "SAVE10" });
    const paymentIntentId = response.body.orderId;

    await Coupon.updateOne({ code: "SAVE10" }, { isActive: false });

    const verifyResponse = await request(app)
      .post("/api/orders/verify-payment")
      .set("Cookie", cookie)
      .send({
        orderId: paymentIntentId,
        razorpay_order_id: response.body.razorpayOrderId,
        razorpay_payment_id: "pay_rollback",
        razorpay_signature: buildSignature({
          orderId: response.body.razorpayOrderId,
          paymentId: "pay_rollback",
        }),
      });

    expect(verifyResponse.status).toBe(409);

    const payment = await Payment.findById(paymentIntentId);
    const orders = await Order.find();
    const updatedProduct = await Product.findById(product._id);
    const cart = await Cart.findOne({ userId: payment.user });

    expect(payment.status).toBe("pending");
    expect(payment.order).toBeFalsy();
    expect(orders).toHaveLength(0);
    expect(updatedProduct.stock).toBe(10);
    expect(cart.items).toHaveLength(1);
  });
});

