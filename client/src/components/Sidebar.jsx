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
    <Link to={to} className={`${base} ${inactive} ${className}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  const [openCustomer, setOpenCustomer] = useState(false);
  const [openMedicine, setOpenMedicine] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  const [openPurchase, setOpenPurchase] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  // Minimal, lightweight icons
  const Icon = {
    dashboard: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="currentColor" className="w-4 mr-3">
        <path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5z"/>
      </svg>
    ),
    usersGroup: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="currentColor" className="w-4 mr-3">
        <path d="M16 11a4 4 0 10-3.999-4A4 4 0 0016 11zM8 12a3 3 0 10-3-3 3 3 0 003 3zm8 2c-3 0-5 1.5-6 3v3h12v-3c-1-1.5-3-3-6-3zM8 14c-2.673 0-4.667 1.334-6 4v2h6v-3a7 7 0 010-3z"/>
      </svg>
    ),
    pills: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="currentColor" className="w-4 mr-3">
        <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm8 8a6 6 0 11-6 6 6 6 0 016-6zm-8 1h4v2H8z"/>
      </svg>
    ),
    supplier: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="currentColor" className="w-4 mr-3">
        <path d="M12 2l9 4v6c0 5-4 9-9 10C7 21 3 17 3 12V6l9-4zM7 12h10v2H7v-2z"/>
      </svg>
    ),
    cart: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="currentColor" className="w-4 mr-3">
        <path d="M7 18a2 2 0 11-.001 3.999A2 2 0 017 18zm10 0a2 2 0 11-.001 3.999A2 2 0 0117 18zM6 6h15l-2 8H8L6 6zM5 4H2V2h3l1 4H3z"/>
      </svg>
    ),
    receipt: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="currentColor" className="w-4 mr-3">
        <path d="M6 2h12l2 2v16l-2-1-2 1-2-1-2 1-2-1-2 1-2-1V4l2-2zm2 5h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
      </svg>
    ),
    chevron: (open) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`}>
        <path d="M12 15l-6-6h12l-6 6z"/>
      </svg>
    ),
  };

  // Paths — synced with App.jsx
  const CUSTOMER = {
    add: "/dashboard/admin/customers/add",
    edit: (id) => `/dashboard/admin/customers/edit/${id}`,
    list: "/dashboard/admin/customers/list",
    credit: "/dashboard/admin/customers/credit",
    paid: "/dashboard/admin/customers/paid",
    ledger: "/dashboard/admin/customers/ledger",
  };

  const MEDICINE = {
    addCategory: "/dashboard/admin/medicines/category/add",
    categoryList: "/dashboard/admin/medicines/category/list",
    addUnit: "/dashboard/admin/medicines/unit/add",
    unitList: "/dashboard/admin/medicines/unit/list",
    addType: "/dashboard/admin/medicines/type/add",
    typeList: "/dashboard/admin/medicines/type/list",
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

  const INVOICE = {
    add: "/dashboard/admin/invoices/add",
    list: "/dashboard/admin/invoices/list",
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

          {/* Medicines */}
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

          {/* Suppliers */}
          <li className="px-2">
            <button
              onClick={() => setOpenSupplier((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openSupplier ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
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
            <button
              onClick={() => setOpenPurchase((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openPurchase ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
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

          {/* Invoices */}
          <li className="px-2">
            <button
              onClick={() => setOpenInvoice((v) => !v)}
              className={`w-full px-4 py-3 flex items-center rounded-sm text-white ${
                openInvoice ? "bg-lime-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {Icon.receipt}
              <span>Invoice</span>
              {Icon.chevron(openInvoice)}
            </button>
            {openInvoice && (
              <ul className="mt-1 ml-4 border-l border-gray-700">
                <li><SidebarLink to={INVOICE.add} label="Add Invoice" className="pl-6 py-2" /></li>
                <li><SidebarLink to={INVOICE.list} label="Invoice List" className="pl-6 py-2" /></li>
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
