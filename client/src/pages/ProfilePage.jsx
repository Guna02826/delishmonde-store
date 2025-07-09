import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/ProfilePage.module.css";

const API_URL = import.meta.env.VITE_API_URL;

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) setUser(storedUser);
    } catch (err) {
      console.error("Invalid user data in storage", err);
      localStorage.removeItem("user");
    }
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    try {
      await axios.delete(`${API_URL}/users/sessions`, {
        withCredentials: true,
      });
      localStorage.removeItem("user");
      localStorage.removeItem("isAdmin");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (!user) {
    return (
      <div className={styles["profile-container"]}>
        <p className={styles["profile-info"]}>You are logged out.</p>
        <button
          onClick={() => navigate("/login")}
          className={styles["login-button"]}
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className={styles["profile-container"]}>
      <p className={styles["profile-info"]}>
        <span>Name:</span> {user.username}
      </p>
      <p className={styles["profile-info"]}>
        <span>Email:</span> {user.email}
      </p>
      <button onClick={handleLogout} className={styles["logout-button"]}>
        Log Out
      </button>
    </div>
  );
}

export default ProfilePage;
