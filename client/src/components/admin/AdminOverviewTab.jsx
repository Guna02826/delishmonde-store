import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faTriangleExclamation, faIndianRupeeSign, faGauge, faPlus, faShoppingBag, faUsers } from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const AdminOverviewTab = ({ setActiveTab }) => {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/summary`, { withCredentials: true });
        setSummary(res.data);
      } catch (err) {
        toast.error("Failed to load dashboard summary");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.summary}>
          {[1, 2, 3].map(i => <div key={i} className={styles.skeleton} style={{height: "120px", borderRadius: "16px"}}></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.summary}>
        <div className={styles.card}>
          <div className={styles.cardIcon}><FontAwesomeIcon icon={faChartLine} /></div>
          <div className={styles.cardInfo}>
            <h3>Total Orders</h3>
            <p>{summary.totalOrders ?? 0}</p>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{background: "rgba(242, 100, 48, 0.1)", color: "var(--color-cta)"}}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div className={styles.cardInfo}>
            <h3>Low Stock (&lt;5)</h3>
            <p>{summary.lowStockCount ?? 0}</p>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{background: "rgba(39, 174, 96, 0.1)", color: "var(--color-success)"}}>
            <FontAwesomeIcon icon={faIndianRupeeSign} />
          </div>
          <div className={styles.cardInfo}>
            <h3>Monthly Revenue</h3>
            <p>₹{summary.monthlyRevenue ?? 0}</p>
          </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3><FontAwesomeIcon icon={faGauge} /> Quick Management</h3>
        </div>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-lg)"}}>
          <button className={`${styles.btn} ${styles.btnCTA}`} onClick={() => setActiveTab("products")}>
            <FontAwesomeIcon icon={faPlus} /> Add New Product
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setActiveTab("orders")}>
            <FontAwesomeIcon icon={faShoppingBag} /> Manage Orders
          </button>
          <button className={styles.btn} style={{background: "var(--color-surface-alt)"}} onClick={() => setActiveTab("users")}>
            <FontAwesomeIcon icon={faUsers} /> User Directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
