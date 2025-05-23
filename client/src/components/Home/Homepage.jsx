// src/components/Home/Homepage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Homepage() {
  const [medicines, setMedicines] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 24; // medicines per page

  useEffect(() => {
    async function fetchMedicines() {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/medicines?page=${page}&limit=${limit}`
        );
        setMedicines(res.data.medicines);
        setTotalPages(res.data.totalPages);
        setError("");
      } catch (err) {
        setError("Failed to load medicines");
      } finally {
        setLoading(false);
      }
    }
    fetchMedicines();
  }, [page]);

  const handlePrev = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="navbar bg-base-100 shadow-sm px-6">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            MediTrack
          </Link>
        </div>
        <div className="flex-none space-x-2">
          {/* Pass role=pharmacy query param here */}
          <Link to="/register?role=pharmacy" className="btn btn-outline btn-sm">
            Register
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero min-h-[300px] bg-base-200 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold text-primary mb-4">
          Welcome to MediTrack Pharmacy Builder
        </h1>
        <p className="max-w-xl text-lg mb-6">
          Manage your pharmacy with ease — add medicines, track inventory, assign
          staff, and monitor sales all in one platform.
        </p>
        <div className="space-x-4">
          {/* Pass role=pharmacy query param here as well */}
          <Link to="/register?role=pharmacy" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg">
            Login
          </Link>
        </div>
      </section>

      {/* Medicines Grid */}
      <main className="flex-grow p-6 bg-base-100 max-w-[1280px] mx-auto">
        <h2 className="text-3xl font-semibold mb-6 text-center">Available Medicines</h2>

        {loading ? (
          <p className="text-center">Loading medicines...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : medicines.length === 0 ? (
          <p className="text-center">No medicines found.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {medicines.map((med) => (
                <div
                  key={med._id}
                  className="card bg-base-100 shadow-sm w-full max-w-[180px]"
                >
                  <figure>
                    <img
                      src={
                        med.picture ||
                        "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                      }
                      alt={med.name}
                      className="h-28 w-full object-cover rounded-t-md"
                    />
                  </figure>
                  <div className="card-body p-3">
                    <h2
                      className="card-title text-sm leading-tight truncate"
                      title={med.name}
                    >
                      {med.name}
                    </h2>
                    <p className="text-xs truncate" title={`Genre: ${med.genericName}`}>
                      Genre: {med.genericName}
                    </p>
                    <p className="text-xs">Amount: {med.amount}</p>
                    <p className="text-xs font-semibold">${med.price}</p>
                    <div className="card-actions justify-end mt-1">
                      <Link
                        to={`/medicine-info/${med._id}`}
                        className="btn btn-primary btn-xs px-3 py-1"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className="btn btn-outline btn-sm"
              >
                Prev
              </button>
              <span className="btn btn-disabled cursor-default text-xs px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={page === totalPages}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-6 bg-base-200 text-base-content">
        <div>
          <p>© 2025 MediTrack Pharmacy Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
