import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/ProfilePage.module.css";
import { useAuth } from "../context/AuthContext";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className={styles["profile-container"]}>
        <p className={styles["profile-info"]}>Loading profile...</p>
      </div>
    );
  }

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
