// src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function SidebarLink({ to, icon, label, onClick, className = "" }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  const base = "px-4 py-3 flex items-center transition-colors duration-150 rounded-sm";
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
    <Link to={to} className={`${base} ${inactive} ${className}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  // State for collapsible menus
  const [openCustomer, setOpenCustomer] = useState(true);
  const [openMedicine, setOpenMedicine] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  const [openPurchase, setOpenPurchase] = useState(false);

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
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493..." />
      </svg>
    ),
    pills: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 3.75A6.75 6.75 0 0115.75 10.5h0A6.75 6.75 0 119 3.75zm6.75 6.75..." />
      </svg>
    ),
    supplier: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16.5 7.5V6a4.5 4.5 0 10-9 0v1.5M3 10.5h18M5.25 10.5v9.75..." />
      </svg>
    ),
    cart: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.09.835l.383..." />
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

  const SUPPLIER = {
    add: "/dashboard/admin/suppliers/add",
    list: "/dashboard/admin/suppliers/list",
    ledger: "/dashboard/admin/suppliers/ledger",
  };

  const PURCHASE = {
    add: "/dashboard/admin/purchases/add",
    list: "/dashboard/admin/purchases/list",
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
            <SidebarLink to="/dashboard/admin" icon={Icon.dashboard} label="Dashboard" />
          </li>

          {/* Customers */}
          <li className="px-2">
            <button onClick={() => setOpenCustomer((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openCustomer ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}>
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

          {/* Medicines */}
          <li className="px-2">
            <button onClick={() => setOpenMedicine((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openMedicine ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}>
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

          {/* Suppliers */}
          <li className="px-2">
            <button onClick={() => setOpenSupplier((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openSupplier ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}>
              {Icon.supplier}
              <span>Supplier</span>
              {Icon.chevron(openSupplier)}
            </button>
            {openSupplier && (
              <ul className="mt-1 ml-4 border-l border-gray-700">
                <li><SidebarLink to={SUPPLIER.add} label="Add Supplier" className="pl-6 py-2" /></li>
                <li><SidebarLink to={SUPPLIER.list} label="Supplier List" className="pl-6 py-2" /></li>
                <li><SidebarLink to={SUPPLIER.ledger} label="Supplier Ledger" className="pl-6 py-2" /></li>
              </ul>
            )}
          </li>

          {/* Purchases */}
          <li className="px-2">
            <button onClick={() => setOpenPurchase((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openPurchase ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}>
              {Icon.cart}
              <span>Purchase</span>
              {Icon.chevron(openPurchase)}
            </button>
            {openPurchase && (
              <ul className="mt-1 ml-4 border-l border-gray-700">
                <li><SidebarLink to={PURCHASE.add} label="Add Purchase" className="pl-6 py-2" /></li>
                <li><SidebarLink to={PURCHASE.list} label="Purchase List" className="pl-6 py-2" /></li>
              </ul>
            )}
          </li>

          {/* Logout */}
          <li className="flex-1" />
          <li className="px-4 py-4">
            <button onClick={handleLogout} className="w-full btn btn-error btn-sm">
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
