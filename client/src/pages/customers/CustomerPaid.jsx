// src/pages/customers/CustomerPaid.jsx
import Sidebar from "../../components/Sidebar";

function CustomerPaid() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar (shared across all pages) */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h2 className="text-2xl font-bold mb-4">Paid Customers</h2>
        <p>This page will show customers who have fully paid.</p>
      </div>
    </div>
  );
}

export default CustomerPaid;
