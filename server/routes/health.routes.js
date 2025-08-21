import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;
