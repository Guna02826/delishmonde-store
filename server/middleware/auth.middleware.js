import jwt from "jsonwebtoken";
import User from "../models/user.model.js"; // make sure this path is correct

export const verifyUser = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "You need to log in to view your order history." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
