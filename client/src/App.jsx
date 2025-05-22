import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddMedicine from "./pages/AddMedicine";
import EditMedicine from "./pages/EditMedicine";
import MedicineDetails from "./pages/MedicineDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NormalDashboard from "./pages/NormalDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Entry route that redirects based on user role */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Normal user dashboard */}
        <Route path="/dashboard/normal" element={<NormalDashboard />} />

        {/* Protected admin dashboard */}
        <Route
          path="/dashboard/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* Pharmacy and Staff dashboards */}
        <Route path="/dashboard/pharmacy" element={<PharmacyDashboard />} />
        <Route path="/dashboard/staff" element={<StaffDashboard />} />

        {/* Medicine CRUD routes */}
        <Route path="/add-medicine" element={<AddMedicine />} />
        <Route path="/edit-medicine/:id" element={<EditMedicine />} />
        <Route path="/medicine-details/:id" element={<MedicineDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
