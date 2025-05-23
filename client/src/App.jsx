import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddMedicine from "./pages/AddMedicine";
import EditMedicine from "./pages/EditMedicine";
import MedicineDetails from "./pages/MedicineDetails";   // Admin details page
import MedicineInfo from "./pages/MedicineInfo";         // Public details page
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NormalDashboard from "./pages/NormalDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import Homepage from "./components/Home/Homepage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
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

        {/* Medicine CRUD routes - Protected */}
        <Route
          path="/add-medicine"
          element={
            <AdminProtectedRoute>
              <AddMedicine />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/edit-medicine/:id"
          element={
            <AdminProtectedRoute>
              <EditMedicine />
            </AdminProtectedRoute>
          }
        />

        {/* Medicine details routes */}
        <Route
          path="/medicine-details/:id"
          element={
            <AdminProtectedRoute>
              <MedicineDetails />
            </AdminProtectedRoute>
          }
        />
        <Route path="/medicine-info/:id" element={<MedicineInfo />} />
      </Routes>
    </Router>
  );
}

export default App;
