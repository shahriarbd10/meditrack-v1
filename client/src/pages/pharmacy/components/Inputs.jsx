// src/pages/pharmacy/components/Inputs.jsx
import React from "react";

export function TextInput({ label, value, onChange }) {
  return (
    <label className="form-control w-full">
      <div className="label"><span className="label-text text-xs">{label}</span></div>
      <input className="input input-bordered w-full" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function NumInput({ label, value, onChange }) {
  return (
    <label className="form-control w-full">
      <div className="label"><span className="label-text text-xs">{label}</span></div>
      <input type="number" className="input input-bordered w-full" value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function DateInput({ label, value, onChange }) {
  return (
    <label className="form-control w-full">
      <div className="label"><span className="label-text text-xs">{label}</span></div>
      <input type="date" className="input input-bordered w-full" value={value}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SelectInput({ label, value, onChange, options = [] }) {
  return (
    <label className="form-control w-full">
      <div className="label"><span className="label-text text-xs">{label}</span></div>
      <select className="select select-bordered w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((op) => <option key={op} value={op}>{op}</option>)}
      </select>
    </label>
  );
}

export function ReadOnly({ label, value }) {
  return (
    <label className="form-control w-full">
      <div className="label"><span className="label-text text-xs">{label}</span></div>
      <input className="input input-bordered w-full" value={value || "—"} readOnly />
    </label>
  );
}
