import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.isAdmin;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
