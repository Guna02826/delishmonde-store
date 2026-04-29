import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useNavigate } from "react-router-dom";
import styles from "../styles/CartPage.module.css";
import axios from "axios";
import FoodItem from "../components/FoodItem";
import {
  applyCoupon,
  clearCart as clearCartApi,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../api/cartApi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

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
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [recommendedFoods, setRecommendedFoods] = useState([]);

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
      try {
        const cart = await getCart();
        setCartItems(formatCartItems(cart));
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
          return;
        }
        toast.error(error.response?.data?.message || "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        const bestSellers = response.data.filter(f => f.category?.includes("Best Sellers")).slice(0, 4);
        setRecommendedFoods(bestSellers.length > 0 ? bestSellers : response.data.slice(0, 4));
      } catch (error) {
        console.error("Failed to load recommendations", error);
      }
    };

    if (cartItems.length === 0 && !loading) {
      fetchRecommendations();
    }
  }, [cartItems.length, loading]);

  const removeFromCart = async (productId) => {
    try {
      const cart = await removeCartItem(productId);
      setCartItems(formatCartItems(cart));
      setAppliedCoupon(null);
      refreshCartCount();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove item.");
    }
  };

  const updateQuantity = async (item, quantity) => {
    if (quantity < 1 || quantity > item.stock) return;

    try {
      const cart = await updateCartItem(item._id, quantity);
      setCartItems(formatCartItems(cart));
      setAppliedCoupon(null);
      refreshCartCount();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update quantity.");
    }
  };

  const clearCart = async () => {
    try {
      await clearCartApi();
      setCartItems([]);
      setAppliedCoupon(null);
      refreshCartCount();
      setCouponCode("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear cart.");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code first.");
      return;
    }

    try {
      const coupon = await applyCoupon(couponCode, checkoutItems);
      setAppliedCoupon(coupon);
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || "Failed to apply coupon.");
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error("You need to log in to proceed to checkout!");
      return navigate("/login");
    }

    const isRazorpayLoaded = await loadRazorpayScript();
    if (!isRazorpayLoaded) {
      toast.error("Unable to load Razorpay checkout. Please try again.");
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_URL}/orders/create-razorpay-order`,
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
              `${API_URL}/orders/verify-payment`,
              {
                orderId: data.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            toast.success("Payment successful! Order placed.");
            setCartItems([]);
            setAppliedCoupon(null);
            setCouponCode("");
            refreshCartCount();
            navigate("/order-success");
          } catch (error) {
            console.error("Payment verification error", error);
            toast.error(
              "Payment verification failed: " +
                (error.response?.data?.message || error.message)
            );
          }
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled. Your order was not completed.");
          },
        },
        theme: {
          color: "#8b4513",
        },
      });

      checkout.open();
    } catch (error) {
      console.error("Checkout error", error);
      toast.error(
        "Error starting checkout: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.cartContainer}>
        <div className={styles.emptyWrapper}>
          <div className={styles.emptyState}>Loading cart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Your order</p>
          <h2>Shopping Cart</h2>
        </div>
        {cartItems.length > 0 && (
          <button className={styles.menuButton} onClick={() => navigate("/menu")}>
            Add More Items
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any of our delicious bakes yet.</p>
            <div className={styles.emptyActions}>
              <button
                className={styles.menuButton}
                onClick={() => navigate("/menu")}
              >
                Browse Menu
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => navigate("/")}
              >
                Go to Home
              </button>
            </div>
          </div>

          {recommendedFoods.length > 0 && (
            <div className={styles.recommendations}>
              <div className={styles.recHeader}>
                <h3>Our Best Sellers</h3>
                <p>Don't miss out on our most popular treats!</p>
              </div>
              <div className={styles.recGrid}>
                {recommendedFoods.map((food) => (
                  <FoodItem key={food._id} food={food} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.cartLayout}>
          <div className={styles.cartList}>
            {cartItems.map((item) => (
              <div key={item._id} className={styles.cartItem}>
                <img
                  src={item.images?.[0] || item.image || "https://placehold.co/100"}
                  alt={item.name}
                />
                <div className={styles.itemDetails}>
                  <div className={styles.itemTopRow}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>Rs. {item.price} each</p>
                    </div>
                    <strong>Rs. {item.price * item.quantity}</strong>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.quantityControls}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                  {item.quantity >= item.stock && (
                    <p className={styles.stockLimit}>Stock limit reached</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <aside className={styles.cartSummary}>
            <h3>Order Summary</h3>
            <div className={styles.couponRow}>
              <input
                type="text"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Coupon code"
              />
              <button onClick={handleApplyCoupon}>Apply</button>
            </div>
            {appliedCoupon && (
              <p className={styles.couponSuccess}>
                Coupon {appliedCoupon.code} applied. You saved Rs.{" "}
                {discountAmount}
              </p>
            )}
            <div className={styles.totalAmount}>
              <div>
                <span>Subtotal</span>
                <strong>Rs. {subtotal}</strong>
              </div>
              {discountAmount > 0 && (
                <div>
                  <span>Discount</span>
                  <strong>- Rs. {discountAmount}</strong>
                </div>
              )}
              <div className={styles.grandTotal}>
                <span>Total</span>
                <strong>Rs. {totalAmount}</strong>
              </div>
            </div>
            <button
              className={styles.checkoutButton}
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              {user?.email === "demo@delishmonde.test"
                ? "Proceed to Demo Checkout"
                : "Proceed to Checkout"}
            </button>
            {user?.email === "demo@delishmonde.test" && (
              <p className={styles.demoDisclaimer}>
                Simulation: No real payment will be processed.
              </p>
            )}
            <button className={styles.clearCart} onClick={clearCart}>
              Clear Cart
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
