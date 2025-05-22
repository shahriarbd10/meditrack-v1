// pages/Dashboard.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      navigate("/"); // No user info, go to login
      return;
    }

    // Redirect based on user role
    switch (user.role) {
      case "admin":
        navigate("/dashboard/admin");
        break;
      case "pharmacy":
        navigate("/dashboard/pharmacy");
        break;
      case "staff":
        navigate("/dashboard/staff");
        break;
      default:
        navigate("/dashboard/normal");
    }
  }, [navigate]);

  return <div>Loading dashboard...</div>;
}
