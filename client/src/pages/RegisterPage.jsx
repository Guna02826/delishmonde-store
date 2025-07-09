import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/RegisterPage.module.css";
const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check for empty fields
    if (!formData.username || !formData.email || !formData.password) {
      setError("All fields are required!");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending data:", formData);
      const response = await axios.post(`${API_URL}/users/`, formData, {
        withCredentials: true,
      });

      alert("Sign-up successful! Please log in.");

      navigate("/login");
    } catch (error) {
      console.error("Register Error:", error.response?.data || error.message);
      setError(
        error.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h2>Register</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSignup}>
        <label>
          Username:
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </label>
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
        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p>
        Already have an account? <a href="/login">Log In</a>
      </p>
    </div>
  );
};

export default Register;
