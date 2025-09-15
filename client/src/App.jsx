// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Dashboards & shells
import AdminDashboard from "./pages/admin/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NormalDashboard from "./pages/NormalDashboard";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import Homepage from "./components/Home/Homepage";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import RegisterPharmacy from "./pages/auth/RegisterPharmacy";

// Customers
import AddCustomer from "./pages/customers/AddCustomer";
import CustomerList from "./pages/customers/CustomerList";
import CustomerCredit from "./pages/customers/CustomerCredit";
import CustomerPaid from "./pages/customers/CustomerPaid";
import CustomerLedger from "./pages/customers/CustomerLedger";
import EditCustomer from "./pages/customers/EditCustomer";

// Medicines
import AddMedicine from "./pages/medicines/AddMedicine";
import EditMedicine from "./pages/medicines/EditMedicine";
import MedicineDetails from "./pages/medicines/MedicineDetails";
import MedicineInfo from "./pages/medicines/MedicineInfo";
import MedicineList from "./pages/medicines/MedicineList";

// Category pages
import AddCategory from "./pages/medicines/AddCategory";
import CategoryList from "./pages/medicines/CategoryList";

// Type pages
import AddType from "./pages/medicines/AddType";
import TypeList from "./pages/medicines/TypeList";

//Unit Pages
import AddUnit from "./pages/medicines/AddUnit";
import UnitList from "./pages/medicines/UnitList";

//Leaf Page
import LeafSettingPage from "./pages/medicines/LeafSetting";

//Supplier
import AddSupplier from "./pages/suppliers/AddSupplier";
import SupplierList from "./pages/suppliers/SupplierList";

//Purchase
import AddPurchase from "./pages/purchases/AddPurchase";
import PurchaseList from "./pages/purchases/PurchaseList";
import EditPurchase from "./pages/purchases/EditPurchase";

//Invoice
import AddInvoice from "./pages/invoices/AddInvoice";
import InvoiceList from "./pages/invoices/InvoiceList";
import InvoicePrint from "./pages/invoices/InvoicePrint";
import EditInvoice from "./pages/invoices/EditInvoice";

//Report
import Reports from "./pages/reports/Reports";

//PharmacyInventory
import PharmacyInventoryDetails from "./pages/PharmacyInventoryDetails";

//Approval
import ApprovalGate from "./pages/pharmacy/components/ApprovalGate";
import ProtectedRoute from "./components/ProtectedRoute";

//AdminApprovaltoPharmacy
// Admin: Pharmacy Registrations
import PharmacyApprovals from "./pages/admin/PharmacyApprovals";


function App() {
  return (
    <Router>
      <Routes>
        {/* ===== Public ===== */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* NEW: Detailed pharmacy register page */}
        <Route path="/register/pharmacy" element={<RegisterPharmacy />} />
        <Route
          path="/pharmacy-inventory/:id"
          element={<PharmacyInventoryDetails />}
        />


        {/* ===== Entry ===== */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/normal" element={<NormalDashboard />} />
        <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />

        {/* ===== Admin (protected) ===== */}
        <Route
          path="/dashboard/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* ===== Customers (protected) ===== */}
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
        {/* Edit — support both patterns */}
        <Route
          path="/edit-customer/:id"
          element={
            <AdminProtectedRoute>
              <EditCustomer />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/customers/edit/:id"
          element={
            <AdminProtectedRoute>
              <EditCustomer />
            </AdminProtectedRoute>
          }
        />

        {/* ===== Pharmacy & Staff ===== */}
        <Route path="/dashboard/pharmacy" element={<PharmacyDashboard />} />
        <Route path="/dashboard/staff" element={<StaffDashboard />} />

                {/* ===== Admin: Pharmacy Approvals (protected) ===== */}
        <Route
          path="/dashboard/admin/approvals"
          element={
            <AdminProtectedRoute>
              <PharmacyApprovals defaultTab="pending" />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/approvals/approved"
          element={
            <AdminProtectedRoute>
              <PharmacyApprovals defaultTab="approved" />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/approvals/rejected"
          element={
            <AdminProtectedRoute>
              <PharmacyApprovals defaultTab="rejected" />
            </AdminProtectedRoute>
          }
        />


        {/* ===== Medicine CRUD (protected) ===== */}
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
              <MedicineList />
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

        {/* ===== Medicine: Category (protected) ===== */}
        <Route
          path="/dashboard/admin/medicines/category/add"
          element={
            <AdminProtectedRoute>
              <AddCategory />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/category/list"
          element={
            <AdminProtectedRoute>
              <CategoryList />
            </AdminProtectedRoute>
          }
        />

        {/* ===== Medicine: Type (protected) ===== */}
        <Route
          path="/dashboard/admin/medicines/type/add"
          element={
            <AdminProtectedRoute>
              <AddType />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/type/list"
          element={
            <AdminProtectedRoute>
              <TypeList />
            </AdminProtectedRoute>
          }
        />

        {/* ===== Medicine: Unit / Leaf (protected) ===== */}
        <Route
          path="/dashboard/admin/medicines/unit/add"
          element={
            <AdminProtectedRoute>
              <AddUnit />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/medicines/unit/list"
          element={
            <AdminProtectedRoute>
              <UnitList />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin/medicines/leaf-setting"
          element={
            <AdminProtectedRoute>
              <LeafSettingPage />
            </AdminProtectedRoute>
          }
        />

        {/* ===== Supplier (protected) ===== */}
        <Route
          path="/dashboard/admin/suppliers/add"
          element={
            <AdminProtectedRoute>
              <AddSupplier />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/suppliers/list"
          element={
            <AdminProtectedRoute>
              <SupplierList />
            </AdminProtectedRoute>
          }
        />

        {/* ===== Purchase (protected) ===== */}
        <Route
          path="/dashboard/admin/purchases/add"
          element={
            <AdminProtectedRoute>
              <AddPurchase />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/purchases/list"
          element={
            <AdminProtectedRoute>
              <PurchaseList />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/purchases/edit/:id"
          element={
            <AdminProtectedRoute>
              <EditPurchase />
            </AdminProtectedRoute>
          }
        />

        {/* ===== Invoice (protected) ===== */}
        <Route
          path="/dashboard/admin/invoices/add"
          element={
            <AdminProtectedRoute>
              <AddInvoice />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/invoices/list"
          element={
            <AdminProtectedRoute>
              <InvoiceList />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/invoices/view/:id"
          element={
            <AdminProtectedRoute>
              <InvoicePrint />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/invoices/edit/:id"
          element={
            <AdminProtectedRoute>
              <EditInvoice />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/reports"
          element={
            <AdminProtectedRoute>
              <Reports />
            </AdminProtectedRoute>
          }
        />


        {/* ===== Approval ===== */}

        <Route
          path="/dashboard/pharmacy"
          element={
            <ProtectedRoute>
              <ApprovalGate>
                <PharmacyDashboard />
              </ApprovalGate>
            </ProtectedRoute>
          }
        />


        
      </Routes>
    </Router>
  );
}

export default App;
