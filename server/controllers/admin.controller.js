import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

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
    const orders = await Order.find({
      userId: req.params.id,
      status: { $ne: "pending" },
    })
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 });
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenueData = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = totalRevenueData[0]?.total || 0;
    const monthlyRevenueData = await Order.aggregate([
      {
        $match: {
          status: { $in: ["processing", "shipped", "delivered"] },
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const monthlyRevenue = monthlyRevenueData[0]?.total || 0;
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 5 } });

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      lowStockCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching summary", error: err.message });
  }
};
