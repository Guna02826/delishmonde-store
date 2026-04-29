import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import OrderSuccess from "./pages/OrderSuccess";

import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#1c2833",
            fontFamily: '"Lato", sans-serif',
            borderRadius: "12px",
            padding: "16px 24px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            fontSize: "15px",
            maxWidth: "450px",
            borderLeft: "6px solid transparent",
          },
          success: {
            style: {
              borderLeft: "6px solid #27ae60",
            },
            iconTheme: {
              primary: "#27ae60",
              secondary: "#ffffff",
            },
          },
          error: {
            style: {
              borderLeft: "6px solid #e74c3c",
            },
            iconTheme: {
              primary: "#e74c3c",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-history"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/order-success" element={<OrderSuccess />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
