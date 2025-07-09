import { Router } from "express";
import { verifyAdmin } from "../middleware/admin.middleware.js";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", getProducts);
router.use(verifyAdmin);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
