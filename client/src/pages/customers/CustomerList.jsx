// src/pages/customers/CustomerList.jsx
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/customers");
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Could not load customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Customer List</h2>

      {loading ? (
        <div className="p-6">Loading customers...</div>
      ) : error ? (
        <div className="p-6 text-red-600">{error}</div>
      ) : customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Mobile</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">City</th>
              <th className="p-2 border">Country</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="p-2 border">{c.name}</td>
                <td className="p-2 border">{c.mobile}</td>
                <td className="p-2 border">{c.email1 || "-"}</td>
                <td className="p-2 border">{c.city || "-"}</td>
                <td className="p-2 border">{c.country || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}

export default CustomerList;
