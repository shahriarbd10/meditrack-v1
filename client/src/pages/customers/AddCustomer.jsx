// src/pages/customers/AddCustomer.jsx
import { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

const CUSTOMER_ROUTES = {
  list: "/dashboard/admin/customers/list",
  paid: "/dashboard/admin/customers/paid",
  credit: "/dashboard/admin/customers/credit",
};

const initialState = {
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
};

function Field({ label, required, children }) {
  return (
    <div className="flex items-start gap-4">
      <label className="w-40 shrink-0 pt-2 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Input({ name, type = "text", placeholder, value, onChange, onBlur, error }) {
  return (
    <>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={[
          "w-full rounded-md border px-3 py-2 text-sm outline-none transition-all",
          "focus:ring-2 focus:ring-blue-500",
          error
            ? "border-red-400 focus:border-red-500"
            : "border-gray-300 focus:border-blue-500",
        ].join(" ")}
        autoComplete="off"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </>
  );
}

export default function AddCustomer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...initialState });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const setField = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["mobile", "phone", "fax", "zip"].includes(name)) {
      setField(name, value.replace(/[^0-9+()\- ]/g, ""));
      return;
    }

    if (name === "previousBalance") {
      // Allow optional leading '-', digits, and a single optional decimal part
      // Examples allowed: "", "-", "-123", "123", "-123.45", "0.5", ".5" (we'll coerce later)
      const pattern = /^-?\d*(\.\d*)?$/;
      if (pattern.test(value)) setField(name, value);
      return;
    }

    setField(name, value);
  };

  const handleBlur = (e) =>
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const errors = useMemo(() => {
    const e = {};
    if (!formData.name.trim()) e.name = "Customer name is required.";
    if (!formData.mobile.trim()) e.mobile = "Mobile number is required.";
    if (formData.email1 && !/^\S+@\S+\.\S+$/.test(formData.email1))
      e.email1 = "Enter a valid email.";
    if (formData.email2 && !/^\S+@\S+\.\S+$/.test(formData.email2))
      e.email2 = "Enter a valid email.";

    // Validate numeric if provided (accepts negatives)
    if (
      formData.previousBalance !== "" &&
      isNaN(Number(formData.previousBalance))
    ) {
      e.previousBalance = "Amount must be a valid number (e.g., -150, 0, 45.75).";
    }
    return e;
  }, [formData]);

  const showError = (name) => touched[name] && errors[name];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      mobile: true,
      email1: touched.email1,
      email2: touched.email2,
      previousBalance: touched.previousBalance,
    });

    if (Object.keys(errors).length) {
      setToast({ type: "error", msg: "Please fix the highlighted fields." });
      return;
    }

    // Coerce previousBalance safely (handles "", "-", "." -> 0)
    const coercedPrevBal =
      formData.previousBalance && !isNaN(Number(formData.previousBalance))
        ? Number(formData.previousBalance)
        : 0;

    setBusy(true);
    try {
      await axios.post("http://localhost:5000/api/customers", {
        ...formData,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        previousBalance: coercedPrevBal, // can be negative
        country: formData.country.trim(),
      });

      setToast({ type: "success", msg: "Customer added successfully." });
      setFormData({ ...initialState });
      setTouched({});
      // Optional redirect:
      // setTimeout(() => navigate(CUSTOMER_ROUTES.list), 700);
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        msg: err?.response?.data?.message || "Failed to add customer.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout showBack={true}>
      {/* Page Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Add Customer</h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(CUSTOMER_ROUTES.list)}
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
          >
            📋 Customer List
          </button>
          <button
            type="button"
            onClick={() => navigate(CUSTOMER_ROUTES.credit)}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
          >
            ⎘ Credit Customer
          </button>
          <button
            type="button"
            onClick={() => navigate(CUSTOMER_ROUTES.paid)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            ✓ Paid Customer
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* LEFT */}
          <div className="space-y-5">
            <Field label="Customer Name" required>
              <Input
                name="name"
                placeholder="Customer Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("name")}
              />
            </Field>
            <Field label="Email Address1">
              <Input
                name="email1"
                type="email"
                placeholder="Email"
                value={formData.email1}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("email1")}
              />
            </Field>
            <Field label="Phone">
              <Input
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="Address 1">
              <Input
                name="address1"
                placeholder="Address 1"
                value={formData.address1}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="Fax">
              <Input
                name="fax"
                placeholder="Fax"
                value={formData.fax}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="State">
              <Input
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="Country">
              <Input
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            <Field label="Mobile No" required>
              <Input
                name="mobile"
                placeholder="Mobile No"
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("mobile")}
              />
            </Field>
            <Field label="Email Address2">
              <Input
                name="email2"
                type="email"
                placeholder="Email Address"
                value={formData.email2}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("email2")}
              />
            </Field>
            <Field label="Contact">
              <Input
                name="contact"
                placeholder="Contact"
                value={formData.contact}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="Address 2">
              <Input
                name="address2"
                placeholder="Address 2"
                value={formData.address2}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="City">
              <Input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="Zip">
              <Input
                name="zip"
                placeholder="Zip"
                value={formData.zip}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Field>
            <Field label="Previous Balance">
              <Input
                name="previousBalance"
                placeholder="Previous Balance"
                value={formData.previousBalance}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("previousBalance")}
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...initialState });
              setTouched({});
            }}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              busy ? "opacity-80 cursor-not-allowed" : ""
            }`}
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
