import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/CartPage.module.css";
import axios from "axios";

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

function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCart);

    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);

    const syncCart = () => {
      const updatedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(updatedCart);
    };

    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter((item) => item._id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
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
          items: cartItems.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
          })),
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
            clearCart();
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
                  ₹{item.price} x {item.quantity}
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
            <button className={styles.clearCart} onClick={clearCart}>
              Clear Cart
            </button>
            <div className={styles.totalAmount}>
              <strong>
                Total: ₹
                {cartItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                )}
              </strong>
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
