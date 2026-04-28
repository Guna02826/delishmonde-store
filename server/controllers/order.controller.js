import Order from "../models/order.model.js";

// Normal history views intentionally exclude legacy pending orders.
const NORMAL_HISTORY_FILTER = { status: { $ne: "pending" } };

// Get Orders for Logged-in User
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.id,
      ...NORMAL_HISTORY_FILTER,
    })
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user orders",
      error: error.message,
    });
  }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or unauthorized" });
    }

    if (["shipped", "delivered"].includes(order.status)) {
      return res
        .status(400)
        .json({ message: "Order cannot be canceled at this stage" });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({ message: "Order canceled successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error canceling order", error });
  }
};


//2.Admin Operations
// Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "username email")
      .populate("products.productId", "name price");

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const status = req.body.status?.toLowerCase();

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated" });
  } catch (err) {
    res.status(500).json({
      message: "Error updating status",
      error: err.message,
    });
  }
};
