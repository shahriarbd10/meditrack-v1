import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/" />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" />; // Or a "Not authorized" page
  }

  return children;
}
