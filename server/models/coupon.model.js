import { Schema, model } from "mongoose";

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    maxUses: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const Coupon = model("Coupon", CouponSchema);

export default Coupon;
