import Coupon from "../models/coupon.model.js";

export const calculateCouponDiscount = async (couponCode, subtotal) => {
  if (!couponCode) {
    return { coupon: null, discountAmount: 0 };
  }

  const coupon = await Coupon.findOne({
    code: couponCode.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    const error = new Error("Invalid or inactive coupon code");
    error.statusCode = 400;
    throw error;
  }

  const discount =
    coupon.discountType === "percentage"
      ? (subtotal * coupon.value) / 100
      : coupon.value;

  return {
    coupon,
    discountAmount: Math.min(subtotal, Math.round(discount * 100) / 100),
  };
};
