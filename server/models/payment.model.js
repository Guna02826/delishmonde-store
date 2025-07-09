import { Schema, model } from "mongoose";

const PaymentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 0 },
  method: {
    type: String,
    enum: ["credit_card", "paypal", "bank_transfer", "cash_on_delivery"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  transactionId: { type: String }, // Optional external reference
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Payment = model("Payment", PaymentSchema);

export default Payment;
