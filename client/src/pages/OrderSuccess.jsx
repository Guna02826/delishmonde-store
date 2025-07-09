import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/OrderSuccess.module.css";


function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className={styles.successContainer}>
      <h2>🎉 Order Placed Successfully!</h2>
      <p>Thank you for your order! Your delicious items will be on their way soon.</p>
      <button className={styles.backToHome} onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}

export default OrderSuccess;
