import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faShoppingBag,
  faUtensils,
  faUsers,
  faTicket,
  faMagnifyingGlass,
  faPlus,
  faPen,
  faTrash,
  faCheck,
  faXmark,
  faHistory,
  faChartLine,
  faTriangleExclamation,
  faIndianRupeeSign,
  faCalendarDay,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import styles from "../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const emptyProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
  images: "",
};

const emptyCouponForm = {
  code: "",
  discountType: "fixed",
  value: "",
  expiresAt: "",
  maxUses: "",
  isActive: true,
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [editingCouponId, setEditingCouponId] = useState(null);
  
  const [selectedUserOrders, setSelectedUserOrders] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);
  
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { withCredentials: true };

        const [summaryRes, usersRes, ordersRes, couponsRes, productsRes] =
          await Promise.all([
          axios.get(`${API_URL}/admin/summary`, config),
          axios.get(`${API_URL}/admin/users`, config),
          axios.get(`${API_URL}/admin/orders`, config),
          axios.get(`${API_URL}/coupons`, config),
          axios.get(`${API_URL}/products`, config),
        ]);

        setSummary(summaryRes.data);
        setUsers(usersRes.data);
        setOrders(ordersRes.data);
        setCoupons(couponsRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error("Admin data load failed", err);
        toast.error("You are not authorized. Please login as admin.");
      } finally {
        setTimeout(() => setLoading(false), 500); // Smooth transition
      }
    };

    fetchData();
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

  const saveCoupon = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        code: couponForm.code,
        discountType: couponForm.discountType,
        value: Number(couponForm.value),
        expiresAt: couponForm.expiresAt || undefined,
        maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : undefined,
        isActive: couponForm.isActive,
      };

      if (editingCouponId) {
        const res = await axios.put(`${API_URL}/coupons/${editingCouponId}`, payload, { withCredentials: true });
        setCoupons(prev => prev.map(c => c._id === editingCouponId ? res.data : c));
        toast.success("Coupon updated!");
      } else {
        const res = await axios.post(`${API_URL}/coupons`, payload, { withCredentials: true });
        setCoupons(prev => [res.data, ...prev]);
        toast.success("Coupon created!");
      }
      setCouponForm(emptyCouponForm);
      setEditingCouponId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      const res = await axios.put(`${API_URL}/coupons/${coupon._id}`, { isActive: !coupon.isActive }, { withCredentials: true });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? res.data : c));
      toast.success(`Coupon ${coupon.isActive ? "disabled" : "enabled"}`);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        category: productForm.category.split(",").map(c => c.trim()).filter(Boolean),
        images: productForm.images.split(",").map(i => i.trim()).filter(Boolean),
      };

      if (editingProductId) {
        const res = await axios.put(`${API_URL}/products/${editingProductId}`, payload, { withCredentials: true });
        setProducts(prev => prev.map(p => p._id === editingProductId ? res.data : p));
        toast.success("Product updated!");
      } else {
        const res = await axios.post(`${API_URL}/products`, payload, { withCredentials: true });
        setProducts(prev => [...prev, res.data]);
        toast.success("Product published!");
      }
      setProductForm(emptyProductForm);
      setEditingProductId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/products/${productId}`, { withCredentials: true });
      setProducts(prev => prev.filter(p => p._id !== productId));
      toast.success("Product removed from inventory.");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (Array.isArray(p.category) && p.category.some(c => c.toLowerCase().includes(productSearch.toLowerCase())))
  );

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

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
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} style={{height: "60px", marginBottom: "40px"}}></div>
        <div className={styles.tabNav} style={{opacity: 0.5}}><div className={styles.skeleton} style={{width: "100%", height: "50px"}}></div></div>
        <div className={styles.summary}>
          {[1, 2, 3].map(i => <div key={i} className={styles.skeleton} style={{height: "120px", borderRadius: "16px"}}></div>)}
        </div>
        <div className={styles.skeleton} style={{height: "300px", borderRadius: "24px"}}></div>
      </div>
    );
  }

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

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
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
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === "orders" && (
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
      )}

      {/* ── PRODUCTS TAB ── */}
      {activeTab === "products" && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>
                <FontAwesomeIcon icon={editingProductId ? faPen : faPlus} /> 
                {editingProductId ? "Modify Product" : "New Product Entry"}
              </h3>
              {editingProductId && (
                <button className={styles.btnDanger} style={{padding: "8px 16px"}} onClick={() => {setEditingProductId(null); setProductForm(emptyProductForm);}}>
                  <FontAwesomeIcon icon={faXmark} /> Cancel Edit
                </button>
              )}
            </div>
            <form onSubmit={saveProduct} className={styles.formGrid}>
              <div className={styles.formControl}>
                <label>Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chocolate Truffle Cake"
                  value={productForm.name}
                  onChange={e => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formControl}>
                <label>Categories (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Best Sellers, Cakes, Vegetarian"
                  value={productForm.category}
                  onChange={e => setProductForm({...productForm, category: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formControl}>
                <label>Unit Price (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={e => setProductForm({...productForm, price: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formControl}>
                <label>Current Stock</label>
                <input
                  type="number"
                  placeholder="Available quantity"
                  value={productForm.stock}
                  onChange={e => setProductForm({...productForm, stock: e.target.value})}
                  required
                />
              </div>
              <div className={`${styles.formControl} ${styles.fullWidth}`}>
                <label>Image URLs (Up to 3, Comma Separated)</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg, ..."
                  value={productForm.images}
                  onChange={e => setProductForm({...productForm, images: e.target.value})}
                />
              </div>
              <div className={`${styles.formControl} ${styles.fullWidth}`}>
                <label>Product Description</label>
                <textarea
                  placeholder="Tell customers what makes this product special..."
                  value={productForm.description}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                />
              </div>
              <button type="submit" className={`${styles.btn} ${styles.btnCTA}`} style={{gridColumn: "1 / -1"}}>
                <FontAwesomeIcon icon={editingProductId ? faCheck : faPlus} /> 
                {editingProductId ? "Confirm Updates" : "Publish to Menu"}
              </button>
            </form>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3><FontAwesomeIcon icon={faBoxOpen} /> Current Inventory</h3>
              <div className={styles.searchContainer} style={{marginBottom: 0}}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                <input 
                  type="text" 
                  className={styles.searchInput} 
                  placeholder="Filter inventory..." 
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.dataGrid}>
              {filteredProducts.length === 0 ? <p style={{textAlign: "center", padding: "40px", color: "var(--color-text-secondary)"}}>No matching products found.</p> : filteredProducts.map(product => (
                <div key={product._id} className={styles.dataRow}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>{product.name}</span>
                    <div className={styles.rowSubtitle}>
                      <span>₹{product.price}</span>
                      <span>•</span>
                      <span style={{color: product.stock < 5 ? "var(--color-error)" : "inherit", fontWeight: product.stock < 5 ? 800 : 400}}>
                        Stock: {product.stock}
                      </span>
                      <span>•</span>
                      <span>{Array.isArray(product.category) ? product.category.join(", ") : product.category}</span>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    <button className={styles.btn} style={{background: "var(--color-bg)", padding: "10px"}} title="Edit Product" onClick={() => {
                      setEditingProductId(product._id);
                      setProductForm({
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        category: product.category.join(", "),
                        description: product.description,
                        images: product.images.join(", ")
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}>
                      <FontAwesomeIcon icon={faPen} style={{color: "var(--color-primary)"}} />
                    </button>
                    <button className={styles.btnDanger} style={{padding: "10px"}} title="Delete Product" onClick={() => deleteProduct(product._id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
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
      )}

      {/* ── COUPONS TAB ── */}
      {activeTab === "coupons" && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>
                <FontAwesomeIcon icon={editingCouponId ? faPen : faTicket} /> 
                {editingCouponId ? "Edit Promotion" : "Launch New Campaign"}
              </h3>
              {editingCouponId && (
                <button className={styles.btnDanger} style={{padding: "8px 16px"}} onClick={() => {setEditingCouponId(null); setCouponForm(emptyCouponForm);}}>
                  <FontAwesomeIcon icon={faXmark} /> Discard Changes
                </button>
              )}
            </div>
            <form onSubmit={saveCoupon} className={styles.formGrid}>
              <div className={styles.formControl}>
                <label>Promotion Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME20"
                  value={couponForm.code}
                  onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                  required
                />
              </div>
              <div className={styles.formControl}>
                <label>Discount Type</label>
                <select value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}>
                  <option value="fixed">Flat Rate (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div className={styles.formControl}>
                <label>Benefit Value</label>
                <input
                  type="number"
                  placeholder="Value of discount"
                  value={couponForm.value}
                  onChange={e => setCouponForm({...couponForm, value: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formControl}>
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={couponForm.expiresAt}
                  onChange={e => setCouponForm({...couponForm, expiresAt: e.target.value})}
                />
              </div>
              <div className={styles.formControl}>
                <label>Usage Limit (Total)</label>
                <input
                  type="number"
                  placeholder="Infinite if empty"
                  value={couponForm.maxUses}
                  onChange={e => setCouponForm({...couponForm, maxUses: e.target.value})}
                />
              </div>
              <div style={{display: "flex", alignItems: "center", gap: "15px", gridColumn: "1 / -1"}}>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={couponForm.isActive} 
                  onChange={e => setCouponForm({...couponForm, isActive: e.target.checked})} 
                  style={{width: "24px", height: "24px", cursor: "pointer"}}
                />
                <label htmlFor="isActive" style={{cursor: "pointer", fontSize: "1rem"}}>Activate promotion immediately</label>
              </div>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{gridColumn: "1 / -1"}}>
                <FontAwesomeIcon icon={editingCouponId ? faCheck : faPlus} /> 
                {editingCouponId ? "Confirm Coupon Update" : "Activate Promotion Code"}
              </button>
            </form>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3><FontAwesomeIcon icon={faTicket} /> Active Promotions</h3>
            </div>
            <div className={styles.dataGrid}>
              {coupons.length === 0 ? <p style={{textAlign: "center", padding: "40px", color: "var(--color-text-secondary)"}}>No coupons created yet.</p> : coupons.map(coupon => (
                <div key={coupon._id} className={styles.dataRow}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>{coupon.code}</span>
                    <div className={styles.rowSubtitle}>
                      <span style={{fontWeight: 800, color: "var(--color-primary)"}}>
                        {coupon.discountType === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`} OFF
                      </span>
                      <span>•</span>
                      <span>Uses: {coupon.usedCount ?? 0} {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}</span>
                      <span>•</span>
                      <span style={{color: coupon.isActive ? "var(--color-success)" : "var(--color-error)"}}>
                        {coupon.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    <button className={styles.btn} style={{background: "var(--color-bg)", color: "var(--color-text-primary)"}} onClick={() => toggleCouponStatus(coupon)}>
                      {coupon.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className={styles.btn} style={{background: "var(--color-bg)"}} onClick={() => {
                      setEditingCouponId(coupon._id);
                      setCouponForm({
                        code: coupon.code,
                        discountType: coupon.discountType,
                        value: coupon.value,
                        expiresAt: coupon.expiresAt?.slice(0, 10) || "",
                        maxUses: coupon.maxUses || "",
                        isActive: coupon.isActive
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}>
                      <FontAwesomeIcon icon={faPen} style={{color: "var(--color-primary)"}} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
