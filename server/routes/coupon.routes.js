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

const buildCouponPayload = (body) => {
  const payload = {};

  if (body.code !== undefined) payload.code = body.code;
  if (body.discountType !== undefined) payload.discountType = body.discountType;
  if (body.value !== undefined) payload.value = Number(body.value);
  if (body.isActive !== undefined) payload.isActive = Boolean(body.isActive);

  if (body.expiresAt !== undefined) {
    payload.expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
  }

  if (body.maxUses !== undefined) {
    payload.maxUses = body.maxUses === "" ? undefined : Number(body.maxUses);
  }

  return payload;
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
    const coupon = await Coupon.create(buildCouponPayload(req.body));

    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      buildCouponPayload(req.body),
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
