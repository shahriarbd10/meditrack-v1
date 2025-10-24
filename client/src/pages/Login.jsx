import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import jwt_decode from "jwt-decode"; // keep as-is
import { motion } from "framer-motion"; // optional animations
import "../../src/index.css";

export default function Login() {
  const [isLogin] = useState(true); // login-only page
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // ---- Normal login ----
  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Google login ----
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwt_decode(credentialResponse.credential);
      const email = decoded.email;
      const name = decoded.name;

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google-login`, {
        email,
        name,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user && res.data.user.role && res.data.user.role !== "normal") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard/normal");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setMessage("Google login failed");
    }
  };

  // ---- validations ----
  const emailInvalid = !!form.email && !/^\S+@\S+\.\S+$/.test(form.email);
  const passwordTooShort = !!form.password && form.password.length < 6;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-100" />
      <div className="pointer-events-none absolute -top-10 -left-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="card shadow-xl bg-white/80 backdrop-blur border border-white/60">
            <div className="card-body p-6 md:p-8">
              {/* Brand + Home button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    {/* Capsule icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="10"
                        width="18"
                        height="8"
                        rx="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path d="M12 10v8" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                  <span className="font-extrabold text-lg tracking-tight text-emerald-700">
                    MediTrack
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="btn btn-ghost btn-sm text-emerald-700"
                >
                  ← Home
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-center">Welcome back</h1>
              <p className="mt-1 text-center text-sm text-base-content/60">
                Sign in to continue
              </p>

              {message && (
                <div className="alert alert-warning mt-4">
                  <span>{message}</span>
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleLogin} className="mt-5 space-y-4">
                {/* Email */}
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Email</span>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2" />
                        <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className={`input input-bordered w-full pl-10 ${
                        emailInvalid ? "input-error" : ""
                      }`}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      autoComplete="email"
                    />
                  </div>
                  {emailInvalid && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        Please enter a valid email.
                      </span>
                    </div>
                  )}
                </label>

                {/* Password */}
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Password</span>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="5"
                          y="10"
                          width="14"
                          height="10"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M8 10V8a4 4 0 118 0v2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`input input-bordered w-full pr-12 pl-10 ${
                        passwordTooShort ? "input-warning" : ""
                      }`}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {passwordTooShort && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        Minimum 6 characters.
                      </span>
                    </div>
                  )}
                </label>

                <div className="flex items-center justify-between text-sm">
                  <label className="label cursor-pointer gap-2">
                    <input type="checkbox" className="checkbox checkbox-sm" />
                    <span className="label-text">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="link link-hover text-emerald-700"
                    onClick={() => alert("Forgot password flow coming soon")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button className="btn btn-primary w-full" disabled={submitting}>
                  {submitting ? <span className="loading loading-spinner" /> : "Login"}
                </button>
              </form>

              {/* Divider */}
              <div className="divider my-6">OR</div>

              {/* Google login */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setMessage("Google Login failed")}
                />
              </div>

              {/* Register link */}
              <p className="mt-6 text-center">
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="link text-emerald-700"
                  onClick={() => navigate("/register/pharmacy?role=pharmacy")}
                >
                  Register here
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-base-content/60">
            © {new Date().getFullYear()} MediTrack — Secure Pharmacy Management
          </p>
        </motion.div>
      </div>
    </div>
  );
}
