import { Router } from "express";

import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import { verifyAdmin } from "../middleware/admin.middleware.js";
import { verifyUser } from "../middleware/auth.middleware.js";
import { calculateCouponDiscount } from "../utils/coupon.js";

const router = Router();

const calculateSubtotal = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("No items provided");
    error.statusCode = 400;
    throw error;
  }

  let subtotal = 0;

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

    subtotal += product.price * quantity;
  }

  return subtotal;
};

router.post("/apply", verifyUser, async (req, res) => {
  try {
    const subtotal = await calculateSubtotal(req.body.items);
    const { coupon, discountAmount } = await calculateCouponDiscount(
      req.body.couponCode,
      subtotal
    );

    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to apply coupon",
    });
  }
});

router.get("/", verifyAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
});

router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { code, discountType, value, isActive = true } = req.body;
    const coupon = await Coupon.create({ code, discountType, value, isActive });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
