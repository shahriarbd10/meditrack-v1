import React from "react";
import { Link } from "react-router-dom";

export default function MedicineCard({ medicine, onDelete }) {
  return (
    <div className="card bg-base-100 w-72 shadow-sm">
      <figure>
        <img src={medicine.picture} alt={medicine.name} className="h-40 w-full object-cover" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {medicine.name}
          <div className="badge badge-secondary ml-2">{medicine.form}</div>
        </h2>
        <p>Genre: {medicine.genericName}</p>
        <p>Amount: {medicine.amount}</p>
        <p>Price: ${medicine.price - (medicine.discount || 0)}</p>
        <div className="card-actions justify-end">
          <Link to={`/medicine-details/${medicine._id}`} className="btn btn-info btn-sm">
            Details
          </Link>
          <Link to={`/edit-medicine/${medicine._id}`} className="btn btn-primary btn-sm">
            Edit
          </Link>
          <button onClick={() => onDelete(medicine._id)} className="btn btn-error btn-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
