import { Router } from "express";
const router = Router();
import {
  getOrders,
  cancelOrder,
} from "../controllers/order.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";

router.use(verifyUser);
router.get("/me", getOrders);
router.put("/:orderId/cancel", cancelOrder);

export default router;
