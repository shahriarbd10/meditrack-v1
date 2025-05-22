import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      setMessage("Registration successful!");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <form onSubmit={handleRegister} className="card bg-base-100 shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
        <input
          type="text"
          placeholder="Full Name"
          className="input input-bordered w-full mb-3"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="input input-bordered w-full mb-3"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="input input-bordered w-full mb-3"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button className="btn btn-success w-full">Register</button>
        {message && <p className="text-sm mt-3 text-center">{message}</p>}
      </form>
    </div>
  );
}
