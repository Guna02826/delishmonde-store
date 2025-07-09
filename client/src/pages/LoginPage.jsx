import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/LoginPage.module.css";
const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      const response = await axios.post(`${API_URL}/users/sessions`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      const { password, ...safeUser } = response.data.user;
      localStorage.setItem("user", JSON.stringify(safeUser)); 

      alert("Login successful!");
      navigate(safeUser.isAdmin ? "/admin" : "/");
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Try again.");
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
      </form>
      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
};

export default Login;
