import { Router } from "express"; // Use require
const router = Router();

import {
  registerUser,
  loginUser,
  loginDemoUser,
  getUserProfile,
  logoutUser,
} from "../controllers/user.controller.js";

router.post("/", registerUser);
router.post("/sessions", loginUser);
router.post("/demo-session", loginDemoUser);
router.get("/me", getUserProfile);
router.delete("/sessions", logoutUser);

export default router; 
