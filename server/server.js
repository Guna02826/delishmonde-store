import express, { json } from "express";
import connectDB from "./config/database.js";

import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();

import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

// Middleware

console.log("Allowed CORS Origin:", process.env.CLIENT_URL);

app.use(json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Allow only this frontend
    credentials: true, // Allow cookies/auth headers
  })
);

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
