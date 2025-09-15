// src/pages/pharmacy/PharmacyDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import ApprovalGate from "./components/ApprovalGate";
import OverviewTab from "./components/OverviewTab";
import InventoryTab from "./components/InventoryTab";
import StaffTab from "./components/StaffTab";
import ProfileTab from "./components/ProfileTab";
import AddFromDBModal from "./components/AddFromDBModal";

const API = {
  staff: "http://localhost:5000/api/staff",
  medicines: "http://localhost:5000/api/medicines",
  inventory: "http://localhost:5000/api/pharmacy-inventory",
  pharmacyByOwner: (ownerId) =>
    `http://localhost:5000/api/pharmacies/by-owner/${ownerId}`,
  pharmacyUpdate: (id) => `http://localhost:5000/api/pharmacies/${id}`,
  approvalStatus: (ownerId) =>
    `http://localhost:5000/api/approvals/status/${ownerId}`,
};

const EXPIRY_WINDOW_DAYS = 30;

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // tabs
  const [tab, setTab] = useState("overview"); // overview | inventory | staff | profile

  // session / user
  const [user, setUser] = useState(null);
  const ownerId = user?._id || user?.id;

  // approval
  const [approval, setApproval] = useState({ status: null, reason: "" });
  const [approvalChecked, setApprovalChecked] = useState(false); // <-- block UI until checked

  // pharmacy profile
  const [pharmacy, setPharmacy] = useState(null);
  const [pharmacyEdit, setPharmacyEdit] = useState(null);
  const [updatingPharmacy, setUpdatingPharmacy] = useState(false);

  // staff
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffMsg, setStaffMsg] = useState("");
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
  });

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

  /* ----------------------- init ----------------------- */
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u || null);
  }, []);

  /* ----------------------- fetch: approval + profile + staff + inventory ----------------------- */
  useEffect(() => {
    if (!ownerId) return;

    (async () => {
      try {
        // Load pharmacy profile first (it already contains approvalStatus)
        const ph = await axios.get(API.pharmacyByOwner(ownerId), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const phData = ph?.data?.data || null;
        setPharmacy(phData);
        setPharmacyEdit(phData);

        // Determine approval with strong precedence:
        // 1) pharmacy.approvalStatus (fresh from DB)
        // 2) GET /approvals/status/:ownerId (fallback / cross-check)
        let status = phData?.approvalStatus || null;
        let reason = phData?.rejectionReason || "";

        if (!status) {
          try {
            const st = await axios.get(API.approvalStatus(ownerId), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            status = st?.data?.approvalStatus ?? status;
            reason = st?.data?.rejectionReason ?? reason;
          } catch {
            // ignore; we'll decide below
          }
        }

        // If we still couldn't resolve, default to "pending" when unsure
        // (better to block than to allow unintended access)
        if (!status) status = "pending";

        setApproval({ status, reason });
      } catch (e) {
        // If pharmacy fetch fails, force pending; this blocks access
        console.error("pharmacy load", e);
        setApproval({ status: "pending", reason: "" });
      } finally {
        setApprovalChecked(true); // <-- approval has been decided
      }

      // Staff
      try {
        setStaffLoading(true);
        const res = await axios.get(`${API.staff}?pharmacyId=${ownerId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setStaffList(res?.data || []);
        setStaffMsg("");
      } catch (e) {
        console.error("staff load", e);
        setStaffMsg("Failed to load staff");
      } finally {
        setStaffLoading(false);
      }

      // Inventory
      try {
        setInvLoading(true);
        const res = await axios.get(`${API.inventory}?pharmacyId=${ownerId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setInventory(res?.data?.data || []);
        setInvMsg("");
      } catch (e) {
        console.error("inventory load", e);
        setInvMsg("Failed to load inventory");
      } finally {
        setInvLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  // prefill prices when a medicine is selected
  useEffect(() => {
    if (!selectedMed) return;
    setAddForm((f) => ({
      ...f,
      purchasePrice:
        f.purchasePrice && f.purchasePrice > 0
          ? f.purchasePrice
          : Number(selectedMed.supplierPrice) || 0,
      sellingPrice:
        f.sellingPrice && f.sellingPrice > 0
          ? f.sellingPrice
          : Number(selectedMed.price) || 0,
      vat: f.vat && f.vat > 0 ? f.vat : Number(selectedMed.vat) || 0,
    }));
  }, [selectedMed]);

  /* ----------------------- KPIs ----------------------- */
  const totalStaff = staffList.length;
  const totalItems = inventory.length;

  const lowStockCount = useMemo(
    () =>
      inventory.filter(
        (it) => Number(it.stock || 0) <= Number(it.minStock || 10)
      ).length,
    [inventory]
  );

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
      const fields = [m.name, m.genericName, m.category]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  }, [inventory, invSearch]);

  /* ----------------------- actions ----------------------- */
  const handleSignOut = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!ownerId) return setStaffMsg("Pharmacy ID not found.");
    try {
      const payload = { ...staffForm, pharmacyId: ownerId };
      const res = await axios.post(API.staff, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setStaffList((prev) => [...prev, res?.data?.user || res?.data]);
      setStaffForm({ name: "", email: "", password: "" });
      setStaffMsg("Staff user added successfully");
    } catch (e) {
      console.error("add staff", e);
      setStaffMsg(
        e?.response?.data?.msg ||
          e?.response?.data?.message ||
          "Failed to add staff"
      );
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await axios.delete(`${API.staff}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setStaffList((prev) => prev.filter((x) => x._id !== id));
      setStaffMsg("Staff deleted");
    } catch (e) {
      console.error("del staff", e);
      setStaffMsg("Failed to delete staff");
    }
  };

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
        batchNo: addForm.batchNo,
        stock: Number(addForm.stock || 0),
        minStock: Number(addForm.minStock || 10),
        purchasePrice: Number(addForm.purchasePrice || 0),
        sellingPrice: Number(addForm.sellingPrice || 0),
        vat: Number(addForm.vat || 0),
        expiryDate: addForm.expiryDate || null,
        notes: addForm.notes || "",
      };
      const res = await axios.post(API.inventory, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
      await axios.delete(`${API.inventory}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setInventory((prev) => prev.filter((x) => x._id !== id));
      setInvMsg("Item deleted");
    } catch (e) {
      console.error("delete inv", e);
      setInvMsg("Failed to delete item");
    }
  };

  const handleUpdateInv = async (id, patch) => {
    try {
      const res = await axios.put(`${API.inventory}/${id}`, patch, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const updated = res?.data?.data;
      setInventory((prev) => prev.map((x) => (x._id === id ? updated : x)));
      setInvMsg("Item updated");
    } catch (e) {
      console.error("update inv", e);
      setInvMsg("Failed to update item");
    }
  };

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
      const res = await axios.put(API.pharmacyUpdate(pharmacy._id), payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPharmacy(res?.data?.data);
    } catch (e) {
      console.error("save pharmacy", e);
    } finally {
      setUpdatingPharmacy(false);
    }
  };

  /* ----------------------- RENDER ----------------------- */

  // not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        Please login.
      </div>
    );
  }

  // wait until approval status is checked BEFORE rendering the dashboard
  if (!approvalChecked) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-dots loading-lg" />
      </div>
    );
  }

  // approval gate (block everything unless approved)
  if (approval.status && approval.status !== "approved") {
    return (
      <ApprovalGate
        status={approval.status}
        reason={approval.reason}
        onSignOut={handleSignOut}
      />
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
        medsFiltered={
          !medSearch.trim()
            ? meds.slice(0, 50)
            : meds
                .filter((m) => {
                  const flds = [m.name, m.genericName, m.category]
                    .filter(Boolean)
                    .map((x) => String(x).toLowerCase());
                  return flds.some((f) => f.includes(medSearch.toLowerCase()));
                })
                .slice(0, 100)
        }
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
