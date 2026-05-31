import { Router } from "express"; // Use require
const router = Router();

import { validate } from "../middleware/validate.middleware.js";
import { registerUserSchema, loginUserSchema } from "../utils/validationSchemas.js";

import {
  registerUser,
  loginUser,
  loginDemoUser,
  getUserProfile,
  logoutUser,
} from "../controllers/user.controller.js";

router.post("/", validate(registerUserSchema), registerUser);
router.post("/sessions", validate(loginUserSchema), loginUser);
router.post("/demo-session", loginDemoUser);
router.get("/me", getUserProfile);
router.delete("/sessions", logoutUser);

export default router; 
