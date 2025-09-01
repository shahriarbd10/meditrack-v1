// src/components/DashboardLayout.jsx
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";

function DashboardLayout({ children, showBack }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        {showBack && (
          <div className="mb-4">
            <Link
              to={-1}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ← Back
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
