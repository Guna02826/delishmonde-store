import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "fixed",
    value: "",
  });
  const [selectedUserOrders, setSelectedUserOrders] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { withCredentials: true };

        const [summaryRes, usersRes, ordersRes, couponsRes] = await Promise.all([
          axios.get(`${API_URL}/admin/summary`, config),
          axios.get(`${API_URL}/admin/users`, config),
          axios.get(`${API_URL}/admin/orders`, config),
          axios.get(`${API_URL}/coupons`, config),
        ]);

        setSummary(summaryRes.data);
        setUsers(usersRes.data);
        setOrders(ordersRes.data);
        setCoupons(couponsRes.data);
      } catch (err) {
        console.error("Admin data load failed", err);
        alert("You are not authorized. Please login as admin.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserClick = async (userId) => {
    setSelectedUserId(userId);
    setLoadingUserOrders(true);

    try {
      const res = await axios.get(
        `${API_URL}/admin/users/${userId}/order-history`,
        { withCredentials: true }
      );
      setSelectedUserOrders(res.data);
    } catch (err) {
      console.error("Failed to load user order history", err);
      setSelectedUserOrders([]);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/admin/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      alert("Status update successfully");
    } catch (err) {
      console.error("Failed to update order status", err);
      alert("Status update failed");
    }
  };

  const createCoupon = async (event) => {
    event.preventDefault();

    try {
      const res = await axios.post(
        `${API_URL}/coupons`,
        {
          ...couponForm,
          value: Number(couponForm.value),
        },
        { withCredentials: true }
      );

      setCoupons((prev) => [res.data, ...prev]);
      setCouponForm({ code: "", discountType: "fixed", value: "" });
    } catch (err) {
      console.error("Failed to create coupon", err);
      alert(err.response?.data?.message || "Coupon creation failed");
    }
  };

  if (loading) return <p>Loading admin dashboard...</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Admin Dashboard</h2>

      {/* Summary Cards */}
      <div className={styles.summary}>
        {[
          { label: "Users", value: summary.totalUsers },
          { label: "Orders", value: summary.totalOrders },
          { label: "Revenue", value: `₹${summary.totalRevenue}` },
        ].map((item) => (
          <div className={styles.card} key={item.label}>
            <h3>{item.label}</h3>
            <p>{item.value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Users List */}
      <div className={styles.section}>
        <h3>All Users</h3>
        <ul className={styles.list}>
          {users.map((user) => (
            <li
              key={user._id}
              onClick={() => handleUserClick(user._id)}
              className={selectedUserId === user._id ? styles.activeUser : ""}
            >
              {user.username} ({user.email})
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h3>Coupons</h3>
        <form onSubmit={createCoupon} className={styles.orderItem}>
          <input
            type="text"
            value={couponForm.code}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, code: event.target.value }))
            }
            placeholder="Code"
            required
          />
          <select
            value={couponForm.discountType}
            onChange={(event) =>
              setCouponForm((prev) => ({
                ...prev,
                discountType: event.target.value,
              }))
            }
          >
            <option value="fixed">fixed</option>
            <option value="percentage">percentage</option>
          </select>
          <input
            type="number"
            min="0"
            value={couponForm.value}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, value: event.target.value }))
            }
            placeholder="Value"
            required
          />
          <button type="submit">Add Coupon</button>
        </form>
        <ul className={styles.list}>
          {coupons.map((coupon) => (
            <li key={coupon._id}>
              <strong>{coupon.code}</strong> - {coupon.discountType}{" "}
              {coupon.value}
            </li>
          ))}
        </ul>
      </div>

      {/* Selected User's Order History */}
      {selectedUserId && (
        <div className={styles.section}>
          <h3>Order History for User ID: {selectedUserId}</h3>
          {loadingUserOrders ? (
            <p>Loading orders...</p>
          ) : selectedUserOrders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <ul className={styles.list}>
              {selectedUserOrders.map((order) => (
                <li key={order._id}>
                  <strong>Order #{order._id.slice(-6)}</strong> - ₹
                  {order.totalPrice}
                  <ul className={styles.subList}>
                    {order.products.map((item, index) => (
                      <li key={index} className={styles.productItem}>
                        🛒 {item.productId?.name || "Unknown Product"} — ₹
                        {item.productId?.price} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* All Orders with Status Control */}
      <div className={styles.section}>
        <h3>All Orders</h3>
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order._id}>
              <div className={styles.orderItem}>
                <span>
                  <strong>#{order._id.slice(-6)}</strong> - ₹{order.totalPrice}{" "}
                  - <em>{order.userId?.username || "Unknown"}</em>
                </span>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                >
                  {[
                    "pending",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
