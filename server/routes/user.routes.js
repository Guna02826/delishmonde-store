import { Router } from "express"; // Use require
const router = Router();

import {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
} from "../controllers/user.controller.js";

router.post("/", registerUser);
router.post("/sessions", loginUser);
router.get("/me", getUserProfile);
router.delete("/sessions", logoutUser);

export default router; 
