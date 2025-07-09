import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//1.Auth
// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid E-mail" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { password: _, ...userInfo } = user._doc;

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      })
      .json({ message: "Login successful", user: userInfo });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Logout user
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

//2.Profile
// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

//3.Admin-relevant
//Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};
