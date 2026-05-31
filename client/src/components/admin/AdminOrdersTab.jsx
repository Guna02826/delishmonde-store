import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faUsers, faIndianRupeeSign, faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/orders`, { withCredentials: true });
        setOrders(res.data);
      } catch (err) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

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
      toast.success("Order status updated successfully!");
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending": return styles.badgePending;
      case "processing": return styles.badgeProcessing;
      case "shipped": return styles.badgeShipped;
      case "delivered": return styles.badgeDelivered;
      case "cancelled": return styles.badgeCancelled;
      default: return "";
    }
  };

  if (loading) {
    return <div className={styles.skeleton} style={{height: "300px", borderRadius: "24px"}}></div>;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3><FontAwesomeIcon icon={faShoppingBag} /> Order History</h3>
        <span className={styles.badge} style={{background: "var(--color-primary-light)", color: "var(--color-primary)"}}>
          {orders.length} Total Orders
        </span>
      </div>
      <div className={styles.dataGrid}>
        {orders.length === 0 ? <p style={{textAlign: "center", padding: "40px", color: "var(--color-text-secondary)"}}>No orders recorded yet.</p> : orders.map((order) => (
          <div key={order._id} className={styles.dataRow}>
            <div className={styles.rowMain}>
              <span className={styles.rowTitle}>Order #{order._id.slice(-6)}</span>
              <div className={styles.rowSubtitle}>
                <span><FontAwesomeIcon icon={faUsers} /> {order.userId?.username || "Guest"}</span>
                <span>•</span>
                <span><FontAwesomeIcon icon={faIndianRupeeSign} /> {order.totalPrice}</span>
                <span>•</span>
                <span><FontAwesomeIcon icon={faCalendarDay} /> {new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className={styles.rowActions}>
              <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
              <select
                className={styles.tabButton}
                style={{padding: "6px 12px", fontSize: "0.8rem", border: "1px solid var(--color-border-light)", background: "white"}}
                value={order.status}
                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
              >
                {["pending", "processing", "shipped", "delivered", "cancelled"].map(s => (
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersTab;
