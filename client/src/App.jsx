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

import "./App.css";

function App() {
  return (
    <Router>
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
