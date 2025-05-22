import React from "react";
import { useNavigate } from "react-router-dom";

export default function NormalDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome, {user.name || user.email}</h1>
      <p>Your account currently has no assigned role.</p>
    </div>
  );
}
