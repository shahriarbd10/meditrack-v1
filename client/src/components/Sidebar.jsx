// src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function SidebarLink({ to, icon, label, onClick, className = "" }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  const base =
    "px-4 py-3 flex items-center transition-colors duration-150 rounded-sm";
  const active = "bg-gray-700 text-white cursor-default";
  const inactive = "hover:bg-gray-700 text-gray-300";

  if (isActive) {
    return (
      <div className={`${base} ${active} ${className}`}>
        {icon}
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`${base} ${inactive} ${className}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [openCustomer, setOpenCustomer] = useState(true);
  const [openMedicine, setOpenMedicine] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  // Icons
  const Icon = {
    dashboard: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    usersGroup: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0Z" />
      </svg>
    ),
    pills: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 3.75A6.75 6.75 0 0115.75 10.5h0A6.75 6.75 0 119 3.75zm6.75 6.75h0A6.75 6.75 0 0122.5 17.25h0A6.75 6.75 0 0115.75 24h0a6.75 6.75 0 01-6.75-6.75h0a6.75 6.75 0 016.75-6.75z" />
      </svg>
    ),
    chevron: (open) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
        className={`w-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    ),
  };

  // Paths
  const CUSTOMER = {
    add: "/dashboard/admin/customers/add",
    list: "/dashboard/admin/customers/list",
    credit: "/dashboard/admin/customers/credit",
    paid: "/dashboard/admin/customers/paid",
    ledger: "/dashboard/admin/customers/ledger",
  };

  const MEDICINE = {
    addCategory: "/dashboard/admin/medicines/add-category",
    categoryList: "/dashboard/admin/medicines/category-list",
    addUnit: "/dashboard/admin/medicines/add-unit",
    unitList: "/dashboard/admin/medicines/unit-list",
    addType: "/dashboard/admin/medicines/add-type",
    typeList: "/dashboard/admin/medicines/type-list",
    leafSetting: "/dashboard/admin/medicines/leaf-setting",
    add: "/dashboard/admin/medicines/add",
    list: "/dashboard/admin/medicines/list",
  };

  return (
    <aside className="hidden w-64 bg-gray-800 md:flex md:flex-col min-h-screen">
      {/* Header */}
      <div className="py-4 px-4 border-b border-gray-700">
        <div className="text-white font-semibold">Admin User</div>
        <div className="text-gray-400 text-sm">admin@gmail.com</div>
      </div>

      {/* Nav */}
      <nav className="text-sm flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1 mt-2">
          {/* Dashboard */}
          <li className="px-2">
            <SidebarLink
              to="/dashboard/admin"
              icon={Icon.dashboard}
              label="Dashboard"
            />
          </li>

          {/* Customers (collapsible) */}
          <li className="px-2">
            <button
              onClick={() => setOpenCustomer((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openCustomer ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {Icon.usersGroup}
              <span>Customer</span>
              {Icon.chevron(openCustomer)}
            </button>

            {openCustomer && (
              <ul className="mt-1 ml-4 border-l border-gray-700">
                <li><SidebarLink to={CUSTOMER.add} label="Add Customer" className="pl-6 py-2" /></li>
                <li><SidebarLink to={CUSTOMER.list} label="Customer List" className="pl-6 py-2" /></li>
                <li><SidebarLink to={CUSTOMER.credit} label="Credit Customer" className="pl-6 py-2" /></li>
                <li><SidebarLink to={CUSTOMER.paid} label="Paid Customer" className="pl-6 py-2" /></li>
                <li><SidebarLink to={CUSTOMER.ledger} label="Customer Ledger" className="pl-6 py-2" /></li>
              </ul>
            )}
          </li>

          {/* Medicines (collapsible) */}
          <li className="px-2">
            <button
              onClick={() => setOpenMedicine((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openMedicine ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {Icon.pills}
              <span>Medicine</span>
              {Icon.chevron(openMedicine)}
            </button>

            {openMedicine && (
              <ul className="mt-1 ml-4 border-l border-gray-700">
                <li><SidebarLink to={MEDICINE.addCategory} label="Add Category" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.categoryList} label="Category List" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.addUnit} label="Add Unit" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.unitList} label="Unit List" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.addType} label="Add Type" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.typeList} label="Type List" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.leafSetting} label="Leaf Setting" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.add} label="Add Medicine" className="pl-6 py-2" /></li>
                <li><SidebarLink to={MEDICINE.list} label="Medicine List" className="pl-6 py-2" /></li>
              </ul>
            )}
          </li>

          <li className="flex-1" />
          <li className="px-4 py-4">
            <button
              onClick={handleLogout}
              className="w-full btn btn-error btn-sm"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
