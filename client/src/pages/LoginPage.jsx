import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/LoginPage.module.css";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Both fields are required!");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/users/sessions`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      const safeUser = await refreshUser();

      toast.success("Login successful!");
      navigate(safeUser?.isAdmin ? "/admin" : "/");
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${API_URL}/users/demo-session`,
        {},
        { withCredentials: true }
      );

      await refreshUser();
      navigate("/menu");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to start demo session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Login</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleLogin}>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>
        <button className={styles.loginButton} type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <button
          className={styles.demoLoginButton}
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          title="Try the full app experience instantly"
        >
          Sign in as Demo User (No login)
        </button>
      </form>
      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
};

export default Login;
