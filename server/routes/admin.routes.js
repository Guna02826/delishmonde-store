import { Router } from "express";
const router = Router();

import { verifyAdmin } from "../middleware/admin.middleware.js";
import {
  getAllUsers,
  getUserOrders,
  getAdminSummary,
} from "../controllers/admin.controller.js";
import {
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";

router.use(verifyAdmin);

// Admin welcome / test route
router.get("/", (req, res) => {
  res.json({ msg: "Welcome, Admin!" });
});

// Dashboard summary: users, orders, revenue
router.get("/summary", getAdminSummary);

// Get all orders
router.get("/orders", getAllOrders);

router.put("/:id/status", updateOrderStatus);

// Get all users
router.get("/users", getAllUsers);

// Get specific user's order history
router.get("/users/:id/order-history", getUserOrders);

export default router;
