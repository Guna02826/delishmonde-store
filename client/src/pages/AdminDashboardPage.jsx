import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const emptyProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
  image: "",
};

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
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

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const getProductPayload = () => ({
    name: productForm.name,
    category: productForm.category
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    price: Number(productForm.price),
    stock: Number(productForm.stock),
    description: productForm.description,
    image: productForm.image,
  });

  const saveProduct = async (event) => {
    event.preventDefault();

    try {
      const payload = getProductPayload();

      if (editingProductId) {
        const res = await axios.put(
          `${API_URL}/products/${editingProductId}`,
          payload,
          { withCredentials: true }
        );

        setProducts((prev) =>
          prev.map((product) =>
            product._id === editingProductId ? res.data : product
          )
        );
      } else {
        const res = await axios.post(`${API_URL}/products`, payload, {
          withCredentials: true,
        });

        setProducts((prev) => [...prev, res.data]);
      }

      setProductForm(emptyProductForm);
      setEditingProductId(null);
    } catch (err) {
      console.error("Failed to save product", err);
      alert(err.response?.data?.message || "Product save failed");
    }
  };

  const editProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || "",
      category: Array.isArray(product.category)
        ? product.category.join(", ")
        : product.category || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description || "",
      image: product.image || "",
    });
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  };

  const deleteProduct = async (productId) => {
    const shouldDelete = window.confirm("Delete this product?");
    if (!shouldDelete) return;

    try {
      await axios.delete(`${API_URL}/products/${productId}`, {
        withCredentials: true,
      });

      setProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (err) {
      console.error("Failed to delete product", err);
      alert(err.response?.data?.message || "Product delete failed");
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

      <div className={styles.section}>
        <h3>Products</h3>
        <form onSubmit={saveProduct} className={styles.productForm}>
          <input
            type="text"
            name="name"
            value={productForm.name}
            onChange={handleProductChange}
            placeholder="Name"
            required
          />
          <input
            type="text"
            name="category"
            value={productForm.category}
            onChange={handleProductChange}
            placeholder="Categories, comma separated"
            required
          />
          <input
            type="number"
            name="price"
            min="0"
            value={productForm.price}
            onChange={handleProductChange}
            placeholder="Price"
            required
          />
          <input
            type="number"
            name="stock"
            min="0"
            value={productForm.stock}
            onChange={handleProductChange}
            placeholder="Stock"
            required
          />
          <input
            type="text"
            name="image"
            value={productForm.image}
            onChange={handleProductChange}
            placeholder="Image URL"
          />
          <textarea
            name="description"
            value={productForm.description}
            onChange={handleProductChange}
            placeholder="Description"
          />
          <div className={styles.formActions}>
            <button type="submit">
              {editingProductId ? "Update Product" : "Add Product"}
            </button>
            {editingProductId && (
              <button type="button" onClick={cancelProductEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <ul className={styles.list}>
          {products.map((product) => (
            <li key={product._id}>
              <div className={styles.productItem}>
                <span>
                  <strong>{product.name}</strong> - Rs. {product.price} - Stock:{" "}
                  {product.stock}
                </span>
                <div className={styles.productActions}>
                  <button onClick={() => editProduct(product)}>Edit</button>
                  <button onClick={() => deleteProduct(product._id)}>
                    Delete
                  </button>
                </div>
              </div>
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
