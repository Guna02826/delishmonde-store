import crypto from "crypto";
import { Router } from "express";
import Razorpay from "razorpay";

import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import Product from "../models/product.model.js";
import { verifyUser } from "../middleware/auth.middleware.js";
import { calculateCouponDiscount } from "../utils/coupon.js";

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

    products.push({
      productId: product._id,
      quantity,
    });

    totalAmount += product.price * quantity;
  }

  return { products, totalAmount };
};

router.use(verifyUser);

router.post("/create-order", async (req, res) => {
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

    const order = await Order.create({
      userId: req.user.id,
      products,
      subtotal,
      discountAmount,
      couponCode: coupon?.code,
      totalPrice: totalAmount,
      status: "pending",
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: req.user.id.toString(),
      },
    });

    await Payment.create({
      order: order._id,
      user: req.user.id,
      amount: totalAmount,
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create Razorpay order",
    });
  }
});

router.post("/verify", async (req, res) => {
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
        { order: orderId, razorpayOrderId: razorpay_order_id, user: req.user.id },
        { status: "failed" }
      );

      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payment = await Payment.findOneAndUpdate(
      { order: orderId, razorpayOrderId: razorpay_order_id, user: req.user.id },
      {
        status: "completed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        transactionId: razorpay_payment_id,
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    await Order.findOneAndUpdate(
      { _id: orderId, userId: req.user.id },
      { status: "processing" }
    );

    res.json({
      message: "Payment verified successfully",
      orderId,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.message,
    });
  }
});

export default router;
