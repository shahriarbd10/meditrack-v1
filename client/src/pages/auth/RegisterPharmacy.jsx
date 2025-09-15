// src/pages/auth/RegisterPharmacy.jsx
import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:5000/api/auth/register";

const DIVISIONS = [
  "Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh",
];

export default function RegisterPharmacy() {
  const [params] = useSearchParams();
  const roleFromQuery = params.get("role") || "pharmacy";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    pharmacyName: "",
    licenseNo: "",
    binVat: "",
    pharmacyType: "Retail",
    establishedYear: "",
    staffCount: 1,
    openingHours: "",
    website: "",
    division: "",
    district: "",
    upazila: "",
    street: "",
    postcode: "",
    agree: false,
  });
  const [logo, setLogo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // Floating centered success dialog
  const [showToast, setShowToast] = useState(false);

  const canSubmit = useMemo(() => {
    const required = [
      form.ownerName,
      form.email,
      form.password,
      form.pharmacyName,
      form.licenseNo,
      form.division,
    ];
    return required.every(Boolean) && form.agree && !submitting;
  }, [form, submitting]);

  const onChange = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return setLogo(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg("Only JPG/PNG/WEBP images allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMsg("Logo is too large (max 3MB).");
      return;
    }
    setMsg("");
    setLogo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setMsg("");

      const fd = new FormData();
      // role and all fields
      fd.append("role", roleFromQuery || "pharmacy");
      Object.entries(form).forEach(([k, v]) => {
        if (k === "agree") return;
        fd.append(k, v ?? "");
      });
      if (logo) fd.append("logo", logo);

      await axios.post(API, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Keep inline message for non-modal contexts; show centered toast dialog
      setMsg("Registration submitted. Your pharmacy is pending admin approval.");
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.msg || "Registration failed");
      setShowToast(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Esc to close dialog
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setShowToast(false);
    };
    if (showToast) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showToast]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-base-200 bg-base-100/90 backdrop-blur">
        <nav className="max-w-[1100px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-extrabold text-lg md:text-xl text-primary">MediTrack</Link>
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-100 via-base-100 to-emerald-50" />
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black text-center"
          >
            Register Your <span className="text-primary">Pharmacy</span>
          </motion.h1>
          <p className="text-center text-base-content/70 mt-2">
            Create your owner account and set up pharmacy details in one step.
          </p>
        </div>
      </section>

      {/* Form */}
      <main className="flex-1">
        <form onSubmit={handleSubmit} className="max-w-[1100px] mx-auto px-4 md:px-6 pb-12">
          {/* Message (kept). Hidden while floating dialog is visible to avoid duplication */}
          {msg && !showToast && (
            <div className={`alert ${msg.toLowerCase().includes("failed") ? "alert-error" : "alert-info"} mb-4`}>
              {msg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Left column */}
            <section className="lg:col-span-7 space-y-6">
              {/* Account */}
              <div className="card bg-base-100 border border-base-200">
                <div className="card-body">
                  <h2 className="card-title text-lg">Owner Account</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="input input-bordered" placeholder="Owner Full Name *" value={form.ownerName} onChange={onChange("ownerName")} />
                    <input className="input input-bordered" placeholder="Email *" type="email" value={form.email} onChange={onChange("email")} />
                    <input className="input input-bordered" placeholder="Phone" value={form.phone} onChange={onChange("phone")} />
                    <input className="input input-bordered" placeholder="Password *" type="password" value={form.password} onChange={onChange("password")} />
                  </div>
                </div>
              </div>

              {/* Pharmacy */}
              <div className="card bg-base-100 border border-base-200">
                <div className="card-body">
                  <h2 className="card-title text-lg">Pharmacy Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="input input-bordered" placeholder="Pharmacy Name *" value={form.pharmacyName} onChange={onChange("pharmacyName")} />
                    <input className="input input-bordered" placeholder="Drug License No. *" value={form.licenseNo} onChange={onChange("licenseNo")} />
                    <select className="select select-bordered" value={form.pharmacyType} onChange={onChange("pharmacyType")}>
                      <option>Retail</option>
                      <option>Hospital</option>
                      <option>Wholesale</option>
                    </select>
                    <input className="input input-bordered" placeholder="BIN / VAT" value={form.binVat} onChange={onChange("binVat")} />
                    <input className="input input-bordered" placeholder="Established Year (e.g. 2010)" value={form.establishedYear} onChange={onChange("establishedYear")} />
                    <input className="input input-bordered" placeholder="Staff Count" type="number" min="1" value={form.staffCount} onChange={onChange("staffCount")} />
                    <input className="input input-bordered md:col-span-2" placeholder="Opening Hours (e.g. Sat–Thu 9:00–21:00)" value={form.openingHours} onChange={onChange("openingHours")} />
                    <input className="input input-bordered md:col-span-2" placeholder="Website (optional)" value={form.website} onChange={onChange("website")} />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="card bg-base-100 border border-base-200">
                <div className="card-body">
                  <h2 className="card-title text-lg">Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select className="select select-bordered" value={form.division} onChange={onChange("division")}>
                      <option value="">Select Division *</option>
                      {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <input className="input input-bordered" placeholder="District" value={form.district} onChange={onChange("district")} />
                    <input className="input input-bordered" placeholder="Upazila" value={form.upazila} onChange={onChange("upazila")} />
                    <input className="input input-bordered" placeholder="Postcode" value={form.postcode} onChange={onChange("postcode")} />
                    <input className="input input-bordered md:col-span-2" placeholder="Street / Area / Landmark" value={form.street} onChange={onChange("street")} />
                  </div>
                </div>
              </div>
            </section>

            {/* Right column */}
            <aside className="lg:col-span-5 space-y-6">
              {/* Logo */}
              <div className="card bg-base-100 border border-base-200">
                <div className="card-body">
                  <h2 className="card-title text-lg">Logo (optional)</h2>
                  <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={handleFile} />
                  {logo && <div className="text-sm text-base-content/70 mt-2">Selected: {logo.name}</div>}
                  <p className="text-xs text-base-content/60">JPG/PNG/WEBP up to 3MB.</p>
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="card bg-base-100 border border-base-200">
                <div className="card-body">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" className="checkbox" checked={form.agree} onChange={onChange("agree")} />
                    <span className="label-text">
                      I confirm the information is accurate and I agree to the Terms.
                    </span>
                  </label>

                  <button className="btn btn-primary w-full mt-3" disabled={!canSubmit}>
                    {submitting ? <span className="loading loading-spinner" /> : "Create Pharmacy Account"}
                  </button>
                  <div className="text-center text-sm mt-3">
                    Already have an account? <Link to="/login" className="link link-primary">Login</Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-6 bg-base-200 text-base-content">
        <div>
          <p>© {new Date().getFullYear()} MediTrack. All rights reserved.</p>
        </div>
      </footer>

      {/* Centered floating success dialog (responsive) */}
      <AnimatePresence>
        {showToast && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* Dialog */}
            <motion.div
              key="dialog"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              aria-modal="true"
              role="dialog"
            >
              <div className="w-full max-w-md sm:max-w-lg bg-white border border-base-200 rounded-2xl shadow-2xl">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-success/10 text-success shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base sm:text-lg">Request submitted</div>
                      <div className="text-sm sm:text-base text-base-content/70 mt-1">
                        Your pharmacy registration is pending admin approval.
                        <br />
                        <span className="italic">Note: this may take up to 24 hours.</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link to="/" className="btn btn-sm sm:btn-md btn-outline">Go Home</Link>
                        <Link to="/login" className="btn btn-sm sm:btn-md btn-primary">Login</Link>
                      </div>
                    </div>
                    <button
                      aria-label="Close"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setShowToast(false)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
