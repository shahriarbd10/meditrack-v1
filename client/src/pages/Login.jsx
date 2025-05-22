import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../../src/index.css"; 

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Login failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "pharmacy", // fixed role for registration here
      });
      setMessage("Registration successful! Please login.");
      setIsLogin(true);
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setMessage(err.response?.data?.msg || "Registration failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const { default: jwt_decode } = await import("jwt-decode");
    const decoded = jwt_decode(credentialResponse.credential);
    localStorage.setItem("token", credentialResponse.credential);
    localStorage.setItem("user", JSON.stringify(decoded));
    setMessage("Google Login successful!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <div className="card-body">
          <h2 className="text-3xl font-bold text-center mb-6">
            {isLogin ? "Login" : "Register as Pharmacy"}
          </h2>
          {message && (
            <p className="text-center mb-4 text-red-600">{message}</p>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="input input-bordered w-full"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="input input-bordered w-full"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
              <button className="btn btn-primary w-full">Login</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="input input-bordered w-full"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="input input-bordered w-full"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="input input-bordered w-full"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
              <button className="btn btn-success w-full">Register</button>
            </form>
          )}

          <div className="divider">OR</div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setMessage("Google Login failed")}
            />
          </div>

          <p
            className="mt-6 text-center cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              setMessage("");
              setIsLogin(!isLogin);
              setForm({ name: "", email: "", password: "" });
            }}
          >
            {isLogin
              ? "Don't have an account? Register now"
              : "Already have an account? Login here"}
          </p>
        </div>
      </div>
    </div>
  );
}
