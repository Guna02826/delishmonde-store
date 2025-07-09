import { Router } from "express";
const router = Router();
import Payment from "../models/payment.model.js";

// 🏦 Mock Payment API
router.post("/", async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;

    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Simulate a delay (e.g., 2 seconds) to mimic real payment processing
    setTimeout(() => {
      res.status(200).json({
        message: "Payment Successful",
        orderId,
        amount,
        paymentMethod,
        transactionId: "TXN" + Math.floor(Math.random() * 1000000), // Generate mock transaction ID
        status: "Paid",
      });
    }, 2000);
  } catch (error) {
    res.status(500).json({ message: "Payment failed", error });
  }
});

export default router;
