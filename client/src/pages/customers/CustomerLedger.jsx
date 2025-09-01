// src/pages/customers/CustomerCredit.jsx
import Sidebar from "../../components/Sidebar";

function CustomerCredit() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar (shared across all pages) */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h2 className="text-2xl font-bold mb-4">Credit Customers</h2>
        <p>This page will show customers with outstanding credit.</p>
      </div>
    </div>
  );
}

export default CustomerCredit;
