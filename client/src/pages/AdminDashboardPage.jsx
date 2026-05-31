import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faShoppingBag,
  faUtensils,
  faUsers,
  faTicket,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/AdminDashboardPage.module.css";

import AdminOverviewTab from "../components/admin/AdminOverviewTab";
import AdminOrdersTab from "../components/admin/AdminOrdersTab";
import AdminProductsTab from "../components/admin/AdminProductsTab";
import AdminUsersTab from "../components/admin/AdminUsersTab";
import AdminCouponsTab from "../components/admin/AdminCouponsTab";

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Administrative Dashboard</h2>

      <nav className={styles.tabNav}>
        {[
          { id: "overview", label: "Overview", icon: faGauge },
          { id: "orders", label: "Orders", icon: faShoppingBag },
          { id: "products", label: "Products", icon: faUtensils },
          { id: "users", label: "Users", icon: faUsers },
          { id: "coupons", label: "Coupons", icon: faTicket },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && <AdminOverviewTab setActiveTab={setActiveTab} />}
      {activeTab === "orders" && <AdminOrdersTab />}
      {activeTab === "products" && <AdminProductsTab />}
      {activeTab === "users" && <AdminUsersTab />}
      {activeTab === "coupons" && <AdminCouponsTab />}
    </div>
  );
};

export default AdminDashboardPage;
