import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash, faCheck, faXmark, faBoxOpen, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const emptyProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
  images: "",
};

const AdminProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_URL}/products`, { withCredentials: true });
        setProducts(res.data);
      } catch (err) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

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

  if (loading) {
    return <div className={styles.skeleton} style={{height: "300px", borderRadius: "24px"}}></div>;
  }

  return (
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
            <input type="text" placeholder="e.g. Chocolate Truffle Cake" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
          </div>
          <div className={styles.formControl}>
            <label>Categories (Comma Separated)</label>
            <input type="text" placeholder="e.g. Best Sellers, Cakes, Vegetarian" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} required />
          </div>
          <div className={styles.formControl}>
            <label>Unit Price (₹)</label>
            <input type="number" placeholder="0.00" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required />
          </div>
          <div className={styles.formControl}>
            <label>Current Stock</label>
            <input type="number" placeholder="Available quantity" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} required />
          </div>
          <div className={`${styles.formControl} ${styles.fullWidth}`}>
            <label>Image URLs (Up to 3, Comma Separated)</label>
            <input type="text" placeholder="https://example.com/image.jpg, ..." value={productForm.images} onChange={e => setProductForm({...productForm, images: e.target.value})} />
          </div>
          <div className={`${styles.formControl} ${styles.fullWidth}`}>
            <label>Product Description</label>
            <textarea placeholder="Tell customers what makes this product special..." value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
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
            <input type="text" className={styles.searchInput} placeholder="Filter inventory..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
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
                  <span style={{color: product.stock < 5 ? "var(--color-error)" : "inherit", fontWeight: product.stock < 5 ? 800 : 400}}>Stock: {product.stock}</span>
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
  );
};

export default AdminProductsTab;
