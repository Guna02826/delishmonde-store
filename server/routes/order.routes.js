import { Router } from "express";
const router = Router();
import {
  getOrders,
  cancelOrder,
} from "../controllers/order.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";
import paymentRoutes from "./payment.routes.js";

router.use(verifyUser);
router.get("/me", getOrders);
router.put("/:orderId/cancel", cancelOrder);
router.use(paymentRoutes);

export default router;
