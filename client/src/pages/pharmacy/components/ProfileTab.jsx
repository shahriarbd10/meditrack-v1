// src/pages/pharmacy/components/ProfileTab.jsx
import React from "react";
import { NumInput, ReadOnly, SelectInput, TextInput } from "./Inputs";

export default function ProfileTab({ user, pharmacy, edit, setEdit, onSave, updating }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User (owner) info - read-only */}
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
              <TextInput label="Website" value={edit?.website || ""} onChange={(v) => setEdit((e) => ({ ...e, website: v }))} />
              <TextInput label="Phone" value={edit?.phone || ""} onChange={(v) => setEdit((e) => ({ ...e, phone: v }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextInput
                label="Division"
                value={edit?.address?.division || ""}
                onChange={(v) =>
                  setEdit((e) => ({ ...e, address: { ...(e.address || {}), division: v } }))
                }
              />
              <TextInput
                label="District"
                value={edit?.address?.district || ""}
                onChange={(v) =>
                  setEdit((e) => ({ ...e, address: { ...(e.address || {}), district: v } }))
                }
              />
              <TextInput
                label="Upazila"
                value={edit?.address?.upazila || ""}
                onChange={(v) =>
                  setEdit((e) => ({ ...e, address: { ...(e.address || {}), upazila: v } }))
                }
              />
              <TextInput
                label="Postcode"
                value={edit?.address?.postcode || ""}
                onChange={(v) =>
                  setEdit((e) => ({ ...e, address: { ...(e.address || {}), postcode: v } }))
                }
              />
              <TextInput
                label="Street / Area"
                value={edit?.address?.street || ""}
                onChange={(v) =>
                  setEdit((e) => ({ ...e, address: { ...(e.address || {}), street: v } }))
                }
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
