import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";

process.env.JWT_SECRET = "test-jwt-secret";
process.env.NODE_ENV = "test";

const { default: app } = await import("../../app.js");
const { connectTestDb, clearTestDb, disconnectTestDb } = await import("./helpers/testDb.js");
const { default: User } = await import("../../models/user.model.js");
const { default: Order } = await import("../../models/order.model.js");
const { default: Product } = await import("../../models/product.model.js");

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

const createSession = async ({ email, isAdmin = false }) => {
  const passwordHash = await bcrypt.hash("Password@123", 10);
  const user = await User.create({
    username: isAdmin ? "Admin" : "User",
    email,
    password: passwordHash,
    isAdmin,
  });

  const loginResponse = await request(app).post("/api/users/sessions").send({
    email,
    password: "Password@123",
  });

  return { user, cookie: loginResponse.headers["set-cookie"]?.[0] };
};

describe("History endpoints exclude pending orders where required", () => {
  it("excludes pending from /orders/me and /admin/users/:id/order-history, but not /admin/orders", async () => {
    const { user, cookie: userCookie } = await createSession({
      email: "user-history@test.com",
      isAdmin: false,
    });
    const { cookie: adminCookie } = await createSession({
      email: "admin-history@test.com",
      isAdmin: true,
    });
    const product = await Product.create({
      name: "History Product",
      category: ["Cakes"],
      price: 100,
      stock: 5,
      description: "Test",
      images: ["https://example.com/p.jpg"],
    });

    await Order.create([
      {
        userId: user._id,
        products: [
          {
            productId: product._id,
            quantity: 1,
            priceAtPurchase: 100,
          },
        ],
        subtotal: 100,
        discountAmount: 0,
        totalPrice: 100,
        status: "pending",
      },
      {
        userId: user._id,
        products: [
          {
            productId: product._id,
            quantity: 1,
            priceAtPurchase: 120,
          },
        ],
        subtotal: 120,
        discountAmount: 0,
        totalPrice: 120,
        status: "processing",
      },
    ]);

    const myOrders = await request(app)
      .get("/api/orders/me")
      .set("Cookie", userCookie);
    expect(myOrders.status).toBe(200);
    expect(myOrders.body.some((order) => order.status === "pending")).toBe(false);

    const adminUserHistory = await request(app)
      .get(`/api/admin/users/${user._id}/order-history`)
      .set("Cookie", adminCookie);
    expect(adminUserHistory.status).toBe(200);
    expect(
      adminUserHistory.body.some((order) => order.status === "pending")
    ).toBe(false);

    const adminAllOrders = await request(app)
      .get("/api/admin/orders")
      .set("Cookie", adminCookie);
    expect(adminAllOrders.status).toBe(200);
    expect(adminAllOrders.body.some((order) => order.status === "pending")).toBe(
      true
    );
  });
});
