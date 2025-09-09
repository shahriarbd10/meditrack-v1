// src/pages/pharmacy/PharmacyDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API = {
  staff: "http://localhost:5000/api/staff",
  medicines: "http://localhost:5000/api/medicines",
  inventory: "http://localhost:5000/api/pharmacy-inventory",
  pharmacyByOwner: (ownerId) => `http://localhost:5000/api/pharmacies/by-owner/${ownerId}`,
  pharmacyUpdate: (id) => `http://localhost:5000/api/pharmacies/${id}`,
};

const EXPIRY_WINDOW_DAYS = 30;

export default function PharmacyDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview"); // overview | inventory | staff | profile

  // session / user
  const [user, setUser] = useState(null);
  const ownerId = user?._id || user?.id;

  // pharmacy profile
  const [pharmacy, setPharmacy] = useState(null);
  const [pharmacyEdit, setPharmacyEdit] = useState(null);
  const [updatingPharmacy, setUpdatingPharmacy] = useState(false);

  // staff
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffMsg, setStaffMsg] = useState("");
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "" });

  // inventory
  const [inventory, setInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invMsg, setInvMsg] = useState("");
  const [invSearch, setInvSearch] = useState("");

  // add-from-DB modal
  const [addOpen, setAddOpen] = useState(false);
  const [meds, setMeds] = useState([]);
  const [medsLoading, setMedsLoading] = useState(false);
  const [medSearch, setMedSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState(null);
  const [addForm, setAddForm] = useState({
    batchNo: "",
    stock: 0,
    minStock: 10,
    purchasePrice: 0,
    sellingPrice: 0,
    vat: 0,
    expiryDate: "",
    notes: "",
  });

  // init
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u || null);
  }, []);

  // fetch pharmacy profile + staff + inventory
  useEffect(() => {
    if (!ownerId) return;

    (async () => {
      // pharmacy profile
      try {
        const res = await axios.get(API.pharmacyByOwner(ownerId));
        setPharmacy(res?.data?.data || null);
        setPharmacyEdit(res?.data?.data || null);
      } catch (e) {
        console.error("pharmacy load", e);
      }

      // staff
      try {
        setStaffLoading(true);
        const res = await axios.get(`${API.staff}?pharmacyId=${ownerId}`);
        setStaffList(res?.data || []);
        setStaffMsg("");
      } catch (e) {
        console.error("staff load", e);
        setStaffMsg("Failed to load staff");
      } finally {
        setStaffLoading(false);
      }

      // inventory
      try {
        setInvLoading(true);
        const res = await axios.get(`${API.inventory}?pharmacyId=${ownerId}`);
        setInventory(res?.data?.data || []);
        setInvMsg("");
      } catch (e) {
        console.error("inventory load", e);
        setInvMsg("Failed to load inventory");
      } finally {
        setInvLoading(false);
      }
    })();
  }, [ownerId]);

  // derived KPIs
  const totalStaff = staffList.length;
  const totalItems = inventory.length;
  const lowStockCount = useMemo(() => {
    return inventory.filter((it) => Number(it.stock || 0) <= Number(it.minStock || 10)).length;
  }, [inventory]);
  const expiringSoonCount = useMemo(() => {
    const now = new Date();
    return inventory.filter((it) => {
      if (!it.expiryDate) return false;
      const d = new Date(it.expiryDate);
      const days = Math.floor((d - now) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= EXPIRY_WINDOW_DAYS;
    }).length;
  }, [inventory]);

  const filteredInv = useMemo(() => {
    if (!invSearch.trim()) return inventory;
    const s = invSearch.toLowerCase();
    return inventory.filter((row) => {
      const m = row.medicineId || {};
      const fields = [m.name, m.genericName, m.category].filter(Boolean).map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  }, [inventory, invSearch]);

  /* -----------------------
     Sign out
  ----------------------- */
  const handleSignOut = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  /* -----------------------
     Staff actions
  ----------------------- */
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!ownerId) return setStaffMsg("Pharmacy ID not found.");
    try {
      const payload = { ...staffForm, pharmacyId: ownerId };
      const res = await axios.post(API.staff, payload);
      setStaffList((prev) => [...prev, res?.data?.user || res?.data]);
      setStaffForm({ name: "", email: "", password: "" });
      setStaffMsg("Staff user added successfully");
    } catch (e) {
      console.error("add staff", e);
      setStaffMsg(e?.response?.data?.msg || e?.response?.data?.message || "Failed to add staff");
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await axios.delete(`${API.staff}/${id}`);
      setStaffList((prev) => prev.filter((x) => x._id !== id));
      setStaffMsg("Staff deleted");
    } catch (e) {
      console.error("del staff", e);
      setStaffMsg("Failed to delete staff");
    }
  };

  /* -----------------------
     Inventory actions
  ----------------------- */
  const openAddModal = async () => {
    try {
      setAddOpen(true);
      if (meds.length === 0) {
        setMedsLoading(true);
        const res = await axios.get(API.medicines);
        const list = res?.data?.data ?? res?.data?.medicines ?? [];
        setMeds(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("load meds", e);
    } finally {
      setMedsLoading(false);
    }
  };

  const handleCreateInv = async () => {
    if (!ownerId || !selectedMed?._id) return;
    try {
      const payload = {
        pharmacyId: ownerId,
        medicineId: selectedMed._id,
        ...addForm,
        stock: Number(addForm.stock || 0),
        minStock: Number(addForm.minStock || 10),
        purchasePrice: Number(addForm.purchasePrice || 0),
        sellingPrice: Number(addForm.sellingPrice || 0),
        vat: Number(addForm.vat || 0),
      };
      const res = await axios.post(API.inventory, payload);
      const row = res?.data?.data;
      if (row) setInventory((prev) => [row, ...prev]);
      // reset
      setSelectedMed(null);
      setAddForm({
        batchNo: "",
        stock: 0,
        minStock: 10,
        purchasePrice: 0,
        sellingPrice: 0,
        vat: 0,
        expiryDate: "",
        notes: "",
      });
      setAddOpen(false);
      setInvMsg("Item added to your inventory");
      setTab("inventory");
    } catch (e) {
      console.error("create inv", e);
      setInvMsg(e?.response?.data?.message || "Failed to add item");
    }
  };

  const handleDeleteInv = async (id) => {
    try {
      await axios.delete(`${API.inventory}/${id}`);
      setInventory((prev) => prev.filter((x) => x._id !== id));
      setInvMsg("Item deleted");
    } catch (e) {
      console.error("delete inv", e);
      setInvMsg("Failed to delete item");
    }
  };

  const handleUpdateInv = async (id, patch) => {
    try {
      const res = await axios.put(`${API.inventory}/${id}`, patch);
      const updated = res?.data?.data;
      setInventory((prev) => prev.map((x) => (x._id === id ? updated : x)));
      setInvMsg("Item updated");
    } catch (e) {
      console.error("update inv", e);
      setInvMsg("Failed to update item");
    }
  };

  /* -----------------------
     Pharmacy profile update
  ----------------------- */
  const savePharmacy = async () => {
    if (!pharmacy?._id) return;
    try {
      setUpdatingPharmacy(true);
      const payload = {
        pharmacyName: pharmacyEdit.pharmacyName,
        pharmacyType: pharmacyEdit.pharmacyType,
        licenseNo: pharmacyEdit.licenseNo,
        binVat: pharmacyEdit.binVat,
        establishedYear: pharmacyEdit.establishedYear,
        staffCount: pharmacyEdit.staffCount,
        openingHours: pharmacyEdit.openingHours,
        website: pharmacyEdit.website,
        phone: pharmacyEdit.phone,
        address: pharmacyEdit.address || {},
      };
      const res = await axios.put(API.pharmacyUpdate(pharmacy._id), payload);
      setPharmacy(res?.data?.data);
    } catch (e) {
      console.error("save pharmacy", e);
    } finally {
      setUpdatingPharmacy(false);
    }
  };

  /* -----------------------
     Derived UI helpers
  ----------------------- */
  const medsFiltered = useMemo(() => {
    if (!medSearch.trim()) return meds.slice(0, 50);
    const s = medSearch.toLowerCase();
    return meds
      .filter((m) => {
        const flds = [m.name, m.genericName, m.category]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());
        return flds.some((f) => f.includes(s));
      })
      .slice(0, 100);
  }, [meds, medSearch]);

  /* -----------------------
     RENDER
  ----------------------- */
  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        Please login.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-base-100/90 border-b border-base-300 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-primary">MediTrack</span>
            <span className="text-base-content/60 text-sm hidden md:inline">
              Pharmacy Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-base-content/70">
              Signed in as <span className="font-medium">{user?.name}</span>
            </div>
            <button className="btn btn-error btn-sm" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4">
        <div role="tablist" className="tabs tabs-boxed bg-base-100">
          {["overview", "inventory", "staff", "profile"].map((t) => (
            <a
              key={t}
              role="tab"
              className={`tab ${tab === t ? "tab-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </a>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-6 pb-10">
        {tab === "overview" && (
          <OverviewTab
            totalStaff={totalStaff}
            totalItems={totalItems}
            lowStockCount={lowStockCount}
            expiringSoonCount={expiringSoonCount}
            invLoading={invLoading}
            staffLoading={staffLoading}
            openAddModal={openAddModal}
          />
        )}

        {tab === "inventory" && (
          <InventoryTab
            invLoading={invLoading}
            invMsg={invMsg}
            inventory={filteredInv}
            setInvSearch={setInvSearch}
            invSearch={invSearch}
            onDelete={handleDeleteInv}
            onUpdate={handleUpdateInv}
            openAddModal={openAddModal}
          />
        )}

        {tab === "staff" && (
          <StaffTab
            staffLoading={staffLoading}
            staffMsg={staffMsg}
            staffList={staffList}
            staffForm={staffForm}
            setStaffForm={setStaffForm}
            onAdd={handleAddStaff}
            onDelete={handleDeleteStaff}
          />
        )}

        {tab === "profile" && (
          <ProfileTab
            user={user}
            pharmacy={pharmacy}
            edit={pharmacyEdit}
            setEdit={setPharmacyEdit}
            onSave={savePharmacy}
            updating={updatingPharmacy}
          />
        )}
      </main>

      {/* Add from DB Modal */}
      <AddFromDBModal
        open={addOpen}
        setOpen={setAddOpen}
        medsLoading={medsLoading}
        medsFiltered={medsFiltered}
        medSearch={medSearch}
        setMedSearch={setMedSearch}
        selectedMed={selectedMed}
        setSelectedMed={setSelectedMed}
        addForm={addForm}
        setAddForm={setAddForm}
        onCreate={handleCreateInv}
      />
    </div>
  );
}

/* =========================================
   Subcomponents
========================================= */

function OverviewTab({
  totalStaff,
  totalItems,
  lowStockCount,
  expiringSoonCount,
  invLoading,
  staffLoading,
  openAddModal,
}) {
  const Card = ({ title, value, hint }) => (
    <div className="card bg-white shadow-md rounded-xl p-4">
      <div className="text-xs uppercase text-base-content/60">{title}</div>
      <div className="mt-1 text-3xl font-bold">
        {invLoading || staffLoading ? (
          <span className="loading loading-dots loading-md" />
        ) : (
          value
        )}
      </div>
      {hint && <div className="text-xs text-base-content/60 mt-1">{hint}</div>}
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Staff" value={totalStaff} />
        <Card title="Inventory Items" value={totalItems} />
        <Card title="Low Stock" value={lowStockCount} hint="Below Min Stock" />
        <Card title="Expiring (30d)" value={expiringSoonCount} />
      </div>

      <div className="card bg-white shadow-md rounded-xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-base-content/60">
              Add items from the main medicine database.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add from DB
          </button>
        </div>
      </div>
    </section>
  );
}

function InventoryTab({
  invLoading,
  invMsg,
  inventory,
  setInvSearch,
  invSearch,
  onDelete,
  onUpdate,
  openAddModal,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={invSearch}
          onChange={(e) => setInvSearch(e.target.value)}
          placeholder="Search by name / generic / category…"
          className="input input-bordered w-full md:w-96"
        />
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add from DB
        </button>
      </div>

      {invMsg && <div className="alert alert-info">{invMsg}</div>}

      {invLoading ? (
        <div className="py-10 text-center">
          <span className="loading loading-dots loading-lg" />
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center text-base-content/70 py-12">
          No items in your inventory yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inventory.map((row) => (
            <InvCard key={row._id} row={row} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </section>
  );
}

function InvCard({ row, onDelete, onUpdate }) {
  const m = row.medicineId || {};
  const img = m.imageUrl
    ? /^https?:\/\//i.test(m.imageUrl)
      ? m.imageUrl
      : `http://localhost:5000${m.imageUrl}`
    : "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp";

  const [edit, setEdit] = useState({
    stock: row.stock ?? 0,
    minStock: row.minStock ?? 10,
    sellingPrice: row.sellingPrice ?? 0,
    purchasePrice: row.purchasePrice ?? 0,
    vat: row.vat ?? 0,
    expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString().slice(0, 10) : "",
    batchNo: row.batchNo || "",
    notes: row.notes || "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await onUpdate(row._id, {
      ...edit,
      stock: Number(edit.stock || 0),
      minStock: Number(edit.minStock || 10),
      sellingPrice: Number(edit.sellingPrice || 0),
      purchasePrice: Number(edit.purchasePrice || 0),
      vat: Number(edit.vat || 0),
    });
    setBusy(false);
  };

  const badge = (() => {
    if (!edit.expiryDate) return null;
    const d = new Date(edit.expiryDate);
    const days = Math.floor((d - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return <span className="badge badge-error">Expired</span>;
    if (days <= 7) return <span className="badge badge-error">Expires in {days}d</span>;
    if (days <= 30) return <span className="badge badge-warning">Expires in {days}d</span>;
    return <span className="badge badge-success">OK</span>;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-white shadow-md rounded-xl overflow-hidden"
    >
      <figure className="relative h-28 bg-base-200">
        <img src={img} alt={m.name} className="h-28 w-full object-cover" />
        <div className="absolute left-2 top-2 flex gap-2">
          {badge}
          {m.category && <span className="badge badge-neutral">{m.category}</span>}
        </div>
      </figure>
      <div className="card-body p-4">
        <h3 className="font-semibold line-clamp-1" title={m.name}>
          {m.name || "Unnamed"}
        </h3>
        <div className="text-xs text-base-content/60 line-clamp-1">{m.genericName}</div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <NumInput
            label="Stock"
            value={edit.stock}
            onChange={(v) => setEdit((e) => ({ ...e, stock: v }))}
          />
          <NumInput
            label="Min Stock"
            value={edit.minStock}
            onChange={(v) => setEdit((e) => ({ ...e, minStock: v }))}
          />
          <NumInput
            label="Sell Price"
            value={edit.sellingPrice}
            onChange={(v) => setEdit((e) => ({ ...e, sellingPrice: v }))}
          />
          <NumInput
            label="Buy Price"
            value={edit.purchasePrice}
            onChange={(v) => setEdit((e) => ({ ...e, purchasePrice: v }))}
          />
          <NumInput label="VAT %" value={edit.vat} onChange={(v) => setEdit((e) => ({ ...e, vat: v }))} />
          <TextInput
            label="Batch No"
            value={edit.batchNo}
            onChange={(v) => setEdit((e) => ({ ...e, batchNo: v }))}
          />
          <DateInput
            label="Expiry"
            value={edit.expiryDate}
            onChange={(v) => setEdit((e) => ({ ...e, expiryDate: v }))}
          />
          <TextInput
            label="Notes"
            value={edit.notes}
            onChange={(v) => setEdit((e) => ({ ...e, notes: v }))}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button className="btn btn-error btn-sm" onClick={() => onDelete(row._id)}>
            Delete
          </button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-xs" /> : "Save"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StaffTab({ staffLoading, staffMsg, staffList, staffForm, setStaffForm, onAdd, onDelete }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-white shadow-md rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Your Staff</h2>
        {staffMsg && <div className="alert alert-info mb-3">{staffMsg}</div>}
        {staffLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-dots loading-lg" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-base-content/70">No staff added yet.</div>
        ) : (
          <ul className="divide-y max-h-96 overflow-y-auto">
            {staffList.map((st) => (
              <li key={st._id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{st.name}</div>
                  <div className="text-xs text-base-content/60">{st.email}</div>
                </div>
                <button className="btn btn-error btn-xs" onClick={() => onDelete(st._id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card bg-white shadow-md rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Add New Staff</h2>
        <form onSubmit={onAdd} className="space-y-3 max-w-md">
          <input
            className="input input-bordered w-full"
            placeholder="Full name"
            value={staffForm.name}
            onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            type="email"
            className="input input-bordered w-full"
            placeholder="Email"
            value={staffForm.email}
            onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="Password"
            value={staffForm.password}
            onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <button className="btn btn-primary w-full">Add Staff</button>
        </form>
      </div>
    </section>
  );
}

function ProfileTab({ user, pharmacy, edit, setEdit, onSave, updating }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User (owner) info - read-only for now */}
      <div className="card bg-white shadow-md rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReadOnly label="Owner Name" value={user?.name} />
          <ReadOnly label="Email" value={user?.email} />
          <ReadOnly label="Role" value={user?.role} />
        </div>
      </div>

      {/* Pharmacy info (editable) */}
      <div className="card bg-white shadow-md rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-2">Pharmacy Information</h2>
        {!pharmacy ? (
          <div className="py-8 text-center text-base-content/60">Loading pharmacy profile…</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextInput
                label="Pharmacy Name"
                value={edit?.pharmacyName || ""}
                onChange={(v) => setEdit((e) => ({ ...e, pharmacyName: v }))}
              />
              <SelectInput
                label="Type"
                value={edit?.pharmacyType || "Retail"}
                onChange={(v) => setEdit((e) => ({ ...e, pharmacyType: v }))}
                options={["Retail", "Hospital", "Wholesale"]}
              />
              <TextInput
                label="License No."
                value={edit?.licenseNo || ""}
                onChange={(v) => setEdit((e) => ({ ...e, licenseNo: v }))}
              />
              <TextInput
                label="BIN/VAT"
                value={edit?.binVat || ""}
                onChange={(v) => setEdit((e) => ({ ...e, binVat: v }))}
              />
              <NumInput
                label="Established Year"
                value={edit?.establishedYear || ""}
                onChange={(v) => setEdit((e) => ({ ...e, establishedYear: v }))}
              />
              <NumInput
                label="Staff Count"
                value={edit?.staffCount || 1}
                onChange={(v) => setEdit((e) => ({ ...e, staffCount: v }))}
              />
              <TextInput
                label="Opening Hours"
                value={edit?.openingHours || ""}
                onChange={(v) => setEdit((e) => ({ ...e, openingHours: v }))}
              />
              <TextInput
                label="Website"
                value={edit?.website || ""}
                onChange={(v) => setEdit((e) => ({ ...e, website: v }))}
              />
              <TextInput
                label="Phone"
                value={edit?.phone || ""}
                onChange={(v) => setEdit((e) => ({ ...e, phone: v }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextInput
                label="Division"
                value={edit?.address?.division || ""}
                onChange={(v) => setEdit((e) => ({ ...e, address: { ...(e.address || {}), division: v } }))}
              />
              <TextInput
                label="District"
                value={edit?.address?.district || ""}
                onChange={(v) => setEdit((e) => ({ ...e, address: { ...(e.address || {}), district: v } }))}
              />
              <TextInput
                label="Upazila"
                value={edit?.address?.upazila || ""}
                onChange={(v) => setEdit((e) => ({ ...e, address: { ...(e.address || {}), upazila: v } }))}
              />
              <TextInput
                label="Postcode"
                value={edit?.address?.postcode || ""}
                onChange={(v) => setEdit((e) => ({ ...e, address: { ...(e.address || {}), postcode: v } }))}
              />
              <TextInput
                label="Street / Area"
                value={edit?.address?.street || ""}
                onChange={(v) => setEdit((e) => ({ ...e, address: { ...(e.address || {}), street: v } }))}
              />
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={onSave} disabled={updating}>
                {updating ? <span className="loading loading-spinner" /> : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AddFromDBModal({
  open,
  setOpen,
  medsLoading,
  medsFiltered,
  medSearch,
  setMedSearch,
  selectedMed,
  setSelectedMed,
  addForm,
  setAddForm,
  onCreate,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.dialog
          open
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          className="modal"
        >
          <div className="modal-box max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Add Product from Medicine DB</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            {/* search + list */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className="input input-bordered w-full"
                    placeholder="Search medicine name/generic/category…"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                  />
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="max-h-80 overflow-y-auto divide-y">
                    {medsLoading ? (
                      <div className="p-6 text-center">
                        <span className="loading loading-dots loading-lg" />
                      </div>
                    ) : medsFiltered.length === 0 ? (
                      <div className="p-6 text-center text-base-content/60">
                        No results.
                      </div>
                    ) : (
                      medsFiltered.map((m) => (
                        <button
                          key={m._id}
                          className={`w-full text-left p-3 hover:bg-base-200 ${
                            selectedMed?._id === m._id ? "bg-base-200" : ""
                          }`}
                          onClick={() => setSelectedMed(m)}
                        >
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-base-content/60">
                            {m.genericName || "—"} • {m.category || "General"}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* config */}
              <div className="lg:col-span-5">
                <div className="card bg-base-100 border">
                  <div className="card-body">
                    <div className="text-sm text-base-content/60">Selected</div>
                    <div className="font-semibold">
                      {selectedMed ? selectedMed.name : "None"}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <TextInput
                        label="Batch No"
                        value={addForm.batchNo}
                        onChange={(v) => setAddForm((f) => ({ ...f, batchNo: v }))}
                      />
                      <NumInput
                        label="Stock"
                        value={addForm.stock}
                        onChange={(v) => setAddForm((f) => ({ ...f, stock: v }))}
                      />
                      <NumInput
                        label="Min Stock"
                        value={addForm.minStock}
                        onChange={(v) => setAddForm((f) => ({ ...f, minStock: v }))}
                      />
                      <NumInput
                        label="Purchase Price"
                        value={addForm.purchasePrice}
                        onChange={(v) => setAddForm((f) => ({ ...f, purchasePrice: v }))}
                      />
                      <NumInput
                        label="Selling Price"
                        value={addForm.sellingPrice}
                        onChange={(v) => setAddForm((f) => ({ ...f, sellingPrice: v }))}
                      />
                      <NumInput
                        label="VAT %"
                        value={addForm.vat}
                        onChange={(v) => setAddForm((f) => ({ ...f, vat: v }))}
                      />
                      <DateInput
                        label="Expiry"
                        value={addForm.expiryDate}
                        onChange={(v) => setAddForm((f) => ({ ...f, expiryDate: v }))}
                      />
                      <TextInput
                        label="Notes"
                        value={addForm.notes}
                        onChange={(v) => setAddForm((f) => ({ ...f, notes: v }))}
                      />
                    </div>

                    <button
                      className="btn btn-primary w-full mt-4"
                      onClick={onCreate}
                      disabled={!selectedMed}
                    >
                      Add to Inventory
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form method="dialog" className="modal-backdrop" onClick={() => setOpen(false)}>
            <button>close</button>
          </form>
        </motion.dialog>
      )}
    </AnimatePresence>
  );
}

/* ---- Tiny Inputs ---- */
function TextInput({ label, value, onChange }) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text text-xs">{label}</span>
      </div>
      <input
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function NumInput({ label, value, onChange }) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text text-xs">{label}</span>
      </div>
      <input
        type="number"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function DateInput({ label, value, onChange }) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text text-xs">{label}</span>
      </div>
      <input
        type="date"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function SelectInput({ label, value, onChange, options = [] }) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text text-xs">{label}</span>
      </div>
      <select
        className="select select-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    </label>
  );
}
function ReadOnly({ label, value }) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text text-xs">{label}</span>
      </div>
      <input className="input input-bordered w-full" value={value || "—"} readOnly />
    </label>
  );
}
