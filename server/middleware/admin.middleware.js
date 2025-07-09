import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
