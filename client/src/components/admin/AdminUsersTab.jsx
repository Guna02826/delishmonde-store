import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faMagnifyingGlass, faHistory } from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const AdminUsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserOrders, setSelectedUserOrders] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
        setUsers(res.data);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserClick = async (userId) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      return;
    }
    
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

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return <div className={styles.skeleton} style={{height: "300px", borderRadius: "24px"}}></div>;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3><FontAwesomeIcon icon={faUsers} /> Customer Directory</h3>
        <div className={styles.searchContainer} style={{marginBottom: 0}}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search by name or email..." 
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.dataGrid}>
        {filteredUsers.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "var(--color-text-secondary)" }}>
            No users match your search.
          </p>
        ) : (
          filteredUsers.map((user) => (
            <React.Fragment key={user._id}>
              <div
                className={`${styles.dataRow} ${selectedUserId === user._id ? styles.activeTab : ""}`}
                onClick={() => handleUserClick(user._id)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.rowMain}>
                  <span className={styles.rowTitle}>{user.username}</span>
                  <span className={styles.rowSubtitle}>{user.email}</span>
                </div>
                <div className={styles.rowActions}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                    {selectedUserId === user._id ? "Hide History" : "View History"}
                  </span>
                  <FontAwesomeIcon icon={faHistory} style={{ color: "var(--color-primary)" }} />
                </div>
              </div>

              {selectedUserId === user._id && (
                <div
                  style={{
                    margin: "var(--space-sm) 0 var(--space-lg) var(--space-xl)",
                    padding: "var(--space-lg)",
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-md)",
                    borderLeft: "4px solid var(--color-primary)",
                    animation: "fadeIn 0.3s ease-out",
                  }}
                >
                  <h4 style={{ marginBottom: "var(--space-md)", fontSize: "0.9rem" }}>
                    Order History: {user.username}
                  </h4>
                  {loadingUserOrders ? (
                    <div className={styles.skeleton} style={{ height: "60px" }}></div>
                  ) : selectedUserOrders.length === 0 ? (
                    <p style={{ fontSize: "0.85rem" }}>No orders yet.</p>
                  ) : (
                    <div className={styles.dataGrid}>
                      {selectedUserOrders.map((order) => (
                        <div
                          key={order._id}
                          className={styles.dataRow}
                          style={{ background: "white", padding: "var(--space-sm) var(--space-md)" }}
                        >
                          <div className={styles.rowMain}>
                            <span className={styles.rowTitle} style={{ fontSize: "0.85rem" }}>
                              Order #{order._id.slice(-6)}
                            </span>
                            <span className={styles.rowSubtitle} style={{ fontSize: "0.75rem" }}>
                              ₹{order.totalPrice} • {order.products.length} items •{" "}
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUsersTab;
