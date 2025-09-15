// src/pages/pharmacy/components/AddFromDBModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DateInput, NumInput, TextInput } from "./Inputs";

export default function AddFromDBModal({
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
                      <div className="p-6 text-center text-base-content/60">No results.</div>
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
                          <div className="text-xs text-base-content/60 mt-1">
                            Default sell: {Number(m.price || 0).toFixed(2)} | Supplier:{" "}
                            {Number(m.supplierPrice || 0).toFixed(2)}
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
                    <div className="font-semibold">{selectedMed ? selectedMed.name : "None"}</div>
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
                        label="Purchase Price (BUY)"
                        value={addForm.purchasePrice}
                        onChange={(v) => setAddForm((f) => ({ ...f, purchasePrice: v }))}
                      />
                      <NumInput
                        label="Selling Price"
                        value={addForm.sellingPrice}
                        onChange={(v) => setAddForm((f) => ({ ...f, sellingPrice: v }))}
                      />
                      <NumInput label="VAT %" value={addForm.vat} onChange={(v) => setAddForm((f) => ({ ...f, vat: v }))} />
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

                    <button className="btn btn-primary w-full mt-4" onClick={onCreate} disabled={!selectedMed}>
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
