import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faPen, faPlus, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles/AdminDashboardPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const emptyCouponForm = {
  code: "",
  discountType: "fixed",
  value: "",
  expiresAt: "",
  maxUses: "",
  isActive: true,
};

const AdminCouponsTab = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [editingCouponId, setEditingCouponId] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get(`${API_URL}/coupons`, { withCredentials: true });
        setCoupons(res.data);
      } catch (err) {
        toast.error("Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

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

  if (loading) {
    return <div className={styles.skeleton} style={{height: "300px", borderRadius: "24px"}}></div>;
  }

  return (
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
            <input type="text" placeholder="e.g. WELCOME20" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} required />
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
            <input type="number" placeholder="Value of discount" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: e.target.value})} required />
          </div>
          <div className={styles.formControl}>
            <label>Expiry Date</label>
            <input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({...couponForm, expiresAt: e.target.value})} />
          </div>
          <div className={styles.formControl}>
            <label>Usage Limit (Total)</label>
            <input type="number" placeholder="Infinite if empty" value={couponForm.maxUses} onChange={e => setCouponForm({...couponForm, maxUses: e.target.value})} />
          </div>
          <div style={{display: "flex", alignItems: "center", gap: "15px", gridColumn: "1 / -1"}}>
            <input type="checkbox" id="isActive" checked={couponForm.isActive} onChange={e => setCouponForm({...couponForm, isActive: e.target.checked})} style={{width: "24px", height: "24px", cursor: "pointer"}} />
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
  );
};

export default AdminCouponsTab;
