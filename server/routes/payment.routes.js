import crypto from "crypto";
import { Router } from "express";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";
import Coupon from "../models/coupon.model.js";
import { verifyUser } from "../middleware/auth.middleware.js";
import { calculateCouponDiscount } from "../utils/coupon.js";
import { sendInvoiceEmail } from "../utils/invoice.js";

const router = Router();

const getRazorpay = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
};

const buildOrderProducts = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("No items provided for checkout");
    error.statusCode = 400;
    throw error;
  }

  let totalAmount = 0;
  const products = [];

  for (const item of items) {
    const quantity = Number(item.quantity);

    if (!item.productId || !Number.isInteger(quantity) || quantity < 1) {
      const error = new Error("Invalid cart item");
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      const error = new Error(`Product not found: ${item.productId}`);
      error.statusCode = 404;
      throw error;
    }

    if (product.stock < quantity) {
      const error = new Error(
        `${product.name} has only ${product.stock} item(s) in stock`
      );
      error.statusCode = 409;
      throw error;
    }

    products.push({
      productId: product._id,
      quantity,
    });

    totalAmount += product.price * quantity;
  }

  return { products, totalAmount };
};

const decrementOrderStock = async (products, session) => {
  for (const item of products) {
    const result = await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { session }
    );

    if (result.matchedCount !== 1) {
      const error = new Error("One or more products no longer have enough stock");
      error.statusCode = 409;
      throw error;
    }
  }
};

const incrementCouponUsage = async (couponCode, session) => {
  if (!couponCode) return;

  const now = new Date();
  const result = await Coupon.updateOne(
    {
      code: couponCode,
      isActive: true,
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { maxUses: { $exists: false } },
            { maxUses: null },
            { usedCount: { $exists: false } },
            { $expr: { $lt: ["$usedCount", "$maxUses"] } },
          ],
        },
      ],
    },
    { $inc: { usedCount: 1 } },
    { session }
  );

  if (result.matchedCount !== 1) {
    const error = new Error("Coupon is no longer available");
    error.statusCode = 409;
    throw error;
  }
};

router.use(verifyUser);

const createRazorpayOrder = async (req, res) => {
  try {
    const { products, totalAmount: subtotal } = await buildOrderProducts(
      req.body.items
    );
    const { coupon, discountAmount } = await calculateCouponDiscount(
      req.body.couponCode,
      subtotal
    );
    const totalAmount = subtotal - discountAmount;
    const razorpay = getRazorpay();

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `checkout_${Date.now()}`,
      notes: {
        userId: req.user.id.toString(),
      },
    });

    const payment = await Payment.create({
      user: req.user.id,
      amount: totalAmount,
      razorpayOrderId: razorpayOrder.id,
      checkoutItems: products,
      subtotal,
      discountAmount,
      couponCode: coupon?.code,
      // Avoid duplicate-key failures on legacy unique transactionId indexes.
      // We replace this with razorpay_payment_id after verification.
      transactionId: razorpayOrder.id,
    });

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: payment._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create Razorpay order",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res
        .status(400)
        .json({ message: "Missing payment verification data" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { _id: orderId, razorpayOrderId: razorpay_order_id, user: req.user.id },
        { status: "failed" }
      );

      return res.status(400).json({ message: "Invalid payment signature" });
    }

    let payment;
    let order;
    let shouldSendInvoice = false;

    await session.withTransaction(async () => {
      payment = await Payment.findOne({
        _id: orderId,
        razorpayOrderId: razorpay_order_id,
        user: req.user.id,
      }).session(session);

      if (!payment) {
        const error = new Error("Payment record not found");
        error.statusCode = 404;
        throw error;
      }

      if (payment.status === "completed") {
        order = await Order.findById(payment.order).session(session);
        return;
      }

      if (!Array.isArray(payment.checkoutItems) || payment.checkoutItems.length === 0) {
        const error = new Error("Checkout items missing for payment");
        error.statusCode = 400;
        throw error;
      }

      await decrementOrderStock(payment.checkoutItems, session);

      order = await Order.create(
        [
          {
            userId: req.user.id,
            products: payment.checkoutItems,
            subtotal: payment.subtotal ?? payment.amount,
            discountAmount: payment.discountAmount ?? 0,
            couponCode: payment.couponCode,
            totalPrice: payment.amount,
            status: "processing",
          },
        ],
        { session }
      ).then((docs) => docs[0]);

      payment.status = "completed";
      payment.order = order._id;
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.transactionId = razorpay_payment_id;
      payment.paidAt = new Date();
      await payment.save({ session });

      await Cart.findOneAndUpdate(
        { userId: req.user.id },
        { items: [] },
        { session }
      );

      await incrementCouponUsage(payment.couponCode, session);

      shouldSendInvoice = true;
    });

    order = await Order.findOne({
      _id: order?._id || payment.order,
      userId: req.user.id,
    }).populate("products.productId", "name price");

    if (shouldSendInvoice) {
      try {
        await sendInvoiceEmail({ to: req.user.email, order });
      } catch (emailError) {
        console.error("Invoice email failed:", emailError.message);
      }
    }

    res.json({
      message: "Payment verified successfully",
      orderId: order?._id,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to verify payment",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-payment", verifyRazorpayPayment);

export default router;
