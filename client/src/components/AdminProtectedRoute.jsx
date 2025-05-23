// components/AdminProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // If no user is logged in or user is not admin, redirect to login
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;  // Redirect to login if not an admin
  }

  return children;  // Allow access if user is an admin
};

export default AdminProtectedRoute;
