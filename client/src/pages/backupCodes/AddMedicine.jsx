import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AddMedicine() {
  const [medicine, setMedicine] = useState({
    name: "",
    genericName: "",
    brandName: "",
    price: "",
    discount: "",
    expiryDate: "",
    totalUnits: "",
    unitType: "strip",
    buyingPrice: "",
    form: "Tablet",
    picture: "",
    amount: "",
    description: "",
    pictureSource: "url", // "url" or "upload"
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setMedicine({ ...medicine, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Resize the image using Cloudinary (or any other service)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "your_cloudinary_preset"); // Set this on Cloudinary
      axios
        .post("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", formData)
        .then((response) => {
          setMedicine({ ...medicine, picture: response.data.secure_url });
        })
        .catch((err) => {
          console.error("Error uploading image", err);
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/medicines/add`, medicine);
      navigate("/dashboard/admin");
    } catch (err) {
      console.error("Error adding medicine", err);
      alert("Failed to add medicine");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-base-100 rounded-md shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-6">Add New Medicine</h2>
      
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/admin")}
        className="btn btn-secondary mb-6"
      >
        Back to Dashboard
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={medicine.name}
          onChange={handleChange}
          placeholder="Medicine Name"
          className="input input-bordered w-full"
          required
        />
        <input
          name="genericName"
          value={medicine.genericName}
          onChange={handleChange}
          placeholder="Generic Name"
          className="input input-bordered w-full"
          required
        />
        <input
          name="brandName"
          value={medicine.brandName}
          onChange={handleChange}
          placeholder="Brand Name"
          className="input input-bordered w-full"
          required
        />
        <input
          name="price"
          type="number"
          step="0.01"
          value={medicine.price}
          onChange={handleChange}
          placeholder="Price"
          className="input input-bordered w-full"
          required
        />
        <input
          name="discount"
          type="number"
          step="0.01"
          value={medicine.discount}
          onChange={handleChange}
          placeholder="Discount (optional)"
          className="input input-bordered w-full"
        />
        <input
          name="expiryDate"
          type="date"
          value={medicine.expiryDate}
          onChange={handleChange}
          className="input input-bordered w-full"
          required
        />
        <input
          name="totalUnits"
          type="number"
          value={medicine.totalUnits}
          onChange={handleChange}
          placeholder="Total Available Units"
          className="input input-bordered w-full"
          required
        />
        <select
          name="unitType"
          value={medicine.unitType}
          onChange={handleChange}
          className="input input-bordered w-full"
          required
        >
          <option value="strip">Strip</option>
          <option value="box">Box</option>
        </select>
        <input
          name="buyingPrice"
          type="number"
          step="0.01"
          value={medicine.buyingPrice}
          onChange={handleChange}
          placeholder="Buying Price (Admin only)"
          className="input input-bordered w-full"
          required
        />
        <select
          name="form"
          value={medicine.form}
          onChange={handleChange}
          className="input input-bordered w-full"
          required
        >
          <option value="Tablet">Tablet</option>
          <option value="Syrup">Syrup</option>
          <option value="Capsule">Capsule</option>
          <option value="Other">Other</option>
        </select>

        {/* Picture Source Options */}
        <div className="flex items-center gap-4">
          <label className="text-sm">Picture Source:</label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="pictureSource"
              value="url"
              checked={medicine.pictureSource === "url"}
              onChange={handleChange}
              className="mr-2"
            />
            URL
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="pictureSource"
              value="upload"
              checked={medicine.pictureSource === "upload"}
              onChange={handleChange}
              className="mr-2"
            />
            Upload
          </label>
        </div>

        {/* Show URL input or file input based on selected picture source */}
        {medicine.pictureSource === "url" ? (
          <input
            name="picture"
            type="url"
            value={medicine.picture}
            onChange={handleChange}
            placeholder="Picture URL (Cloudinary)"
            className="input input-bordered w-full"
            required
          />
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="input input-bordered w-full"
          />
        )}

        <input
          name="amount"
          value={medicine.amount}
          onChange={handleChange}
          placeholder="Amount (mg/ml)"
          className="input input-bordered w-full"
          required
        />
        <textarea
          name="description"
          value={medicine.description}
          onChange={handleChange}
          placeholder="Description"
          className="input input-bordered w-full"
          rows={4}
          required
        />
        <button type="submit" className="btn btn-primary w-full">
          Add Medicine
        </button>
      </form>
    </div>
  );
}
