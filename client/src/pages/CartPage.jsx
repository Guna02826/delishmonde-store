import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/CartPage.module.css";
import axios from "axios";
import {
  applyCoupon,
  clearCart as clearCartApi,
  getCart,
  removeCartItem,
} from "../api/cartApi";

const API_URL = import.meta.env.VITE_API_URL;

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const formatCartItems = (cart) =>
  cart.items
    .filter((item) => item.productId)
    .map((item) => ({
      ...item.productId,
      quantity: item.quantity,
    }));

function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const checkoutItems = cartItems.map((item) => ({
    productId: item._id,
    quantity: item.quantity,
  }));
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAmount = subtotal - discountAmount;

  useEffect(() => {
    const loadCart = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) setUser(storedUser);

      try {
        const cart = await getCart();
        setCartItems(formatCartItems(cart));
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
          return;
        }

        alert(error.response?.data?.message || "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  const removeFromCart = async (productId) => {
    try {
      const cart = await removeCartItem(productId);
      setCartItems(formatCartItems(cart));
      setAppliedCoupon(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove item.");
    }
  };

  const clearCart = async () => {
    try {
      await clearCartApi();
      setCartItems([]);
      setAppliedCoupon(null);
      setCouponCode("");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to clear cart.");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      alert("Enter a coupon code first.");
      return;
    }

    try {
      const coupon = await applyCoupon(couponCode, checkoutItems);
      setAppliedCoupon(coupon);
    } catch (error) {
      setAppliedCoupon(null);
      alert(error.response?.data?.message || "Failed to apply coupon.");
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      alert("You need to log in to proceed to checkout!");
      return navigate("/login");
    }

    const isRazorpayLoaded = await loadRazorpayScript();
    if (!isRazorpayLoaded) {
      alert("Unable to load Razorpay checkout. Please try again.");
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_URL}/payments/create-order`,
        {
          items: checkoutItems,
          couponCode: appliedCoupon?.code,
        },
        { withCredentials: true }
      );

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Delish Monde",
        description: "Bakery order payment",
        order_id: data.razorpayOrderId,
        prefill: {
          name: user.username,
          email: user.email,
        },
        handler: async (response) => {
          try {
            await axios.post(
              `${API_URL}/payments/verify`,
              {
                orderId: data.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            alert("Payment successful! Order placed.");
            await clearCart();
            navigate("/order-success");
          } catch (error) {
            console.error("Payment verification error", error);
            alert(
              "Payment verification failed: " +
                (error.response?.data?.message || error.message)
            );
          }
        },
        modal: {
          ondismiss: () => {
            alert("Payment cancelled. Your order was not completed.");
          },
        },
        theme: {
          color: "#8b4513",
        },
      });

      checkout.open();
    } catch (error) {
      console.error("Checkout error", error);
      alert(
        "Error starting checkout: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  if (loading) return <p className={styles.cartContainer}>Loading cart...</p>;

  return (
    <div className={styles.cartContainer}>
      <h2>Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <button
            className={styles.menuButton}
            onClick={() => navigate("/menu")}
          >
            Menu
          </button>
        </div>
      ) : (
        <>
          {cartItems.map((item) => (
            <div key={item._id} className={styles.cartItem}>
              <img
                src={item.image || "https://placehold.co/100"}
                alt={item.name}
              />
              <div>
                <h3>{item.name}</h3>
                <p>
                  Rs. {item.price} x {item.quantity}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item._id)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
          <div className={styles.cartSummary}>
            <div className={styles.couponRow}>
              <input
                type="text"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Coupon code"
              />
              <button onClick={handleApplyCoupon}>Apply Coupon</button>
            </div>
            {appliedCoupon && (
              <p className={styles.couponSuccess}>
                Coupon {appliedCoupon.code} applied. You saved Rs.{" "}
                {discountAmount}
              </p>
            )}
            <button className={styles.clearCart} onClick={clearCart}>
              Clear Cart
            </button>
            <div className={styles.totalAmount}>
              <p>Subtotal: Rs. {subtotal}</p>
              {discountAmount > 0 && <p>Discount: - Rs. {discountAmount}</p>}
              <strong>Total: Rs. {totalAmount}</strong>
            </div>
            <button
              className={styles.checkoutButton}
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
