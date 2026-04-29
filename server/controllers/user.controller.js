import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DEMO_USER = {
  username: "Demo Guest",
  email: "demo@delishmonde.test",
  password: "Demo@12345",
};

const setAuthCookie = (res, user) => {
  const token = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 1000,
  });
};

const toSafeUser = (user) => {
  const { password: _, ...userInfo } = user._doc;
  return userInfo;
};

const validatePasswordPolicy = (password) => {
  if (typeof password !== "string") {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character";
  }

  return null;
};

//1.Auth
// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

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

    setAuthCookie(res, user).json({
      message: "Login successful",
      user: toSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const loginDemoUser = async (req, res) => {
  try {
    let user = await User.findOne({ email: DEMO_USER.email });

    if (!user) {
      const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
      user = await User.create({
        username: DEMO_USER.username,
        email: DEMO_USER.email,
        password: hashedPassword,
        isAdmin: false,
      });
    }

    setAuthCookie(res, user).json({
      message: "Demo login successful",
      user: toSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to start demo session" });
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
      .json({ message: "Internal Server Error", error: error.message });
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
