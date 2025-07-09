import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/CartPage.module.css";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

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

    const orderData = {
      items: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
      })),
      totalAmount: cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    };

    try {
      const res = await axios.post(`${API_URL}/orders`, orderData, {
        withCredentials: true,
      });

      alert("Order placed successfully!");
      clearCart();
      navigate("/order-success");
    } catch (error) {
      console.error("Order error", error);
      alert(
        "Error placing order: " +
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
