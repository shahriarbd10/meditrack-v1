// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddMedicine from "./pages/AddMedicine"; // 👈 still using your working one
import EditMedicine from "./pages/EditMedicine";
import MedicineDetails from "./pages/MedicineDetails";
import MedicineInfo from "./pages/MedicineInfo";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NormalDashboard from "./pages/NormalDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import Homepage from "./components/Home/Homepage";

// ✅ Customer pages
import AddCustomer from "./pages/customers/AddCustomer";
import CustomerList from "./pages/customers/CustomerList";
import CustomerCredit from "./pages/customers/CustomerCredit";
import CustomerPaid from "./pages/customers/CustomerPaid";
import CustomerLedger from "./pages/customers/CustomerLedger";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Entry route */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Normal user */}
        <Route path="/dashboard/normal" element={<NormalDashboard />} />

        {/* Redirect if someone goes to /admin directly */}
        <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Admin dashboard (protected) */}
        <Route
          path="/dashboard/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* ================= Customers ================= */}
        <Route
          path="/dashboard/admin/customers/add"
          element={
            <AdminProtectedRoute>
              <AddCustomer />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/customers/list"
          element={
            <AdminProtectedRoute>
              <CustomerList />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/customers/credit"
          element={
            <AdminProtectedRoute>
              <CustomerCredit />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/customers/paid"
          element={
            <AdminProtectedRoute>
              <CustomerPaid />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/customers/ledger"
          element={
            <AdminProtectedRoute>
              <CustomerLedger />
            </AdminProtectedRoute>
          }
        />

        {/* ================= Pharmacy & Staff ================= */}
        <Route path="/dashboard/pharmacy" element={<PharmacyDashboard />} />
        <Route path="/dashboard/staff" element={<StaffDashboard />} />

        {/* ================= Medicine CRUD ================= */}
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
        <Route
          path="/medicine-details/:id"
          element={
            <AdminProtectedRoute>
              <MedicineDetails />
            </AdminProtectedRoute>
          }
        />
        <Route path="/medicine-info/:id" element={<MedicineInfo />} />

        {/* ================= Medicine Sidebar Items ================= */}
        <Route
          path="/dashboard/admin/medicines/add"
          element={
            <AdminProtectedRoute>
              <AddMedicine />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/list"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Medicine List (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/category/add"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Add Category (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/category/list"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Category List (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/unit/add"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Add Unit (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/unit/list"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Unit List (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/type/add"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Add Type (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/type/list"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Type List (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/leaf-setting"
          element={
            <AdminProtectedRoute>
              <div className="p-6">Leaf Setting (coming soon)</div>
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
