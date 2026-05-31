import { Router } from "express";
import { verifyAdmin } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createProductSchema, updateProductSchema } from "../utils/validationSchemas.js";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", getProducts);
router.use(verifyAdmin);
router.post("/", validate(createProductSchema), createProduct);
router.put("/:id", validate(updateProductSchema), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
