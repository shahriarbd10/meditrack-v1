import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";

import AdminProtectedRoute from "./components/AdminProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/dashboard/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pharmacy"
          element={<PharmacyDashboard />}
        />
        <Route
          path="/dashboard/staff"
          element={<StaffDashboard />}
        />
      </Routes>
    </Router>
  );
}

export default App;
