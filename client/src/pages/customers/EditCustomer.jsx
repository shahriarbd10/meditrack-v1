// src/pages/customers/EditCustomer.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

// Keep paths in sync with Sidebar.jsx
const CUSTOMER_ROUTES = {
  list: "/dashboard/admin/customers/list",
  edit: (id) => `/dashboard/admin/customers/edit/${id}`,
};

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email1: "",
    email2: "",
    phone: "",
    contact: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    fax: "",
    previousBalance: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Guard: missing id
  useEffect(() => {
    if (!id) {
      setError("No customer ID in route.");
      setLoading(false);
    }
  }, [id]);

  // Load existing customer
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers/${id}`);
        const c = res.data?.customer || res.data; // support either shape
        if (!c) throw new Error("Customer not found");

        if (!cancelled) {
          setFormData({
            name: c.name ?? "",
            mobile: c.mobile ?? "",
            email1: c.email1 ?? "",
            email2: c.email2 ?? "",
            phone: c.phone ?? "",
            contact: c.contact ?? "",
            address1: c.address1 ?? "",
            address2: c.address2 ?? "",
            city: c.city ?? "",
            state: c.state ?? "",
            zip: c.zip ?? "",
            country: c.country ?? "",
            fax: c.fax ?? "",
            previousBalance: c.previousBalance ?? "",
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load customer");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) return setError("Name is required");
    if (!formData.mobile.trim()) return setError("Mobile is required");

    try {
      setSaving(true);
      await axios.put(`${import.meta.env.VITE_API_URL}/customers/${id}`, {
        ...formData,
        previousBalance:
          formData.previousBalance === "" ? "" : Number(formData.previousBalance),
      });
      alert("Customer updated successfully!");
      navigate(CUSTOMER_ROUTES.list);
    } catch (e) {
      console.error(e);
      setError("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/customers/${id}`);
      alert("Customer deleted");
      navigate(CUSTOMER_ROUTES.list);
    } catch (e) {
      console.error(e);
      alert("Failed to delete customer");
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar: same shell as Admin pages */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-primary">Edit Customer</h2>
            <p className="text-sm text-gray-500">Update customer details and balance.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              type="button"
            >
              ← Back
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
              type="button"
              disabled={!id}
            >
              Delete
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border bg-white p-6 shadow-sm">Loading…</div>
        ) : error ? (
          <div className="rounded-lg border bg-white p-6 text-red-600 shadow-sm">{error}</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 rounded-lg border bg-white p-6 shadow-sm md:grid-cols-2"
          >
            {/* Left column */}
            <div className="grid gap-4">
              <Input label="Name *" name="name" value={formData.name} onChange={handleChange} required />
              <Input label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} required />
              <Input label="Email 1" name="email1" type="email" value={formData.email1} onChange={handleChange} />
              <Input label="Email 2" name="email2" type="email" value={formData.email2} onChange={handleChange} />
              <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
              <Input label="Contact Person" name="contact" value={formData.contact} onChange={handleChange} />
              <Input label="Fax" name="fax" value={formData.fax} onChange={handleChange} />
            </div>

            {/* Right column */}
            <div className="grid gap-4">
              <Input label="Address 1" name="address1" value={formData.address1} onChange={handleChange} />
              <Input label="Address 2" name="address2" value={formData.address2} onChange={handleChange} />
              <Input label="City" name="city" value={formData.city} onChange={handleChange} />
              <Input label="State" name="state" value={formData.state} onChange={handleChange} />
              <Input label="ZIP" name="zip" value={formData.zip} onChange={handleChange} />
              <Input label="Country" name="country" value={formData.country} onChange={handleChange} />
              <Input
                label="Previous Balance"
                name="previousBalance"
                type="number"
                step="0.01"
                value={formData.previousBalance}
                onChange={handleChange}
              />
            </div>

            {/* Footer actions */}
            <div className="md:col-span-2 mt-2 flex items-center justify-end gap-3">
              {error && (
                <span className="mr-auto text-sm text-red-600" role="alert">
                  {error}
                </span>
              )}
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => navigate(CUSTOMER_ROUTES.list)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** Small input helper */
function Input({ label, name, value, onChange, type = "text", required = false, step }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        className="w-full rounded border px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        step={step}
      />
    </label>
  );
}
