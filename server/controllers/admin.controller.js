import User from "../models/user.model.js";
import Order from "../models/order.model.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

// Get orders of a specific user
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id }).populate(
      "products.productId",
      "name price"
    );
    res.json(orders);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: err.message });
  }
};

// Admin summary: user count, order count, total revenue
export const getAdminSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenueData = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = totalRevenueData[0]?.total || 0;

    res.json({ totalUsers, totalOrders, totalRevenue });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching summary", error: err.message });
  }
};
