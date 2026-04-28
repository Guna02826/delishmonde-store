import { Schema, model } from "mongoose";

const PaymentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: "Order" },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 0 },
  method: {
    type: String,
    enum: ["razorpay"],
    default: "razorpay",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  razorpayOrderId: { type: String, required: true },
  checkoutItems: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  subtotal: { type: Number, min: 0 },
  discountAmount: { type: Number, min: 0, default: 0 },
  couponCode: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  transactionId: { type: String },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Payment = model("Payment", PaymentSchema);

export default Payment;
