import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Shipment.css";

const Shipment = () => {
  const [shipments, setShipments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);

  // Fetch ASN products
  const fetchShipments = () => {
    axios
      .get("http://localhost:5989/shipment/list")
      .then((res) => setShipments(res.data.data))
      .catch((err) => console.error("Fetch Error:", err));
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // ✅ CORRECT UPLOAD (FILE ONLY)
  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(
        "http://localhost:5989/shipment/add-excel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Shipment uploaded successfully");
      setShowUpload(false);
      setFile(null);
      fetchShipments();
    } catch (error) {
      console.error("Upload Error:", error);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Upload failed"
      );
    }
  };

  return (
    <div className="shipment-container">
      <div className="shipment-header">
        <h1>Shipment Page</h1>
        <button className="add-btn" onClick={() => setShowUpload(true)}>
          Add Shipment
        </button>
      </div>

      {/* Table */}
      <table className="shipment-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ASN No</th>
            <th>Received From</th>
            
          </tr>
        </thead>
        <tbody>
          {shipments.map((item, index) => (
      <tr key={item.asn_no}>
        <td>{index + 1}</td> {/* Sequence number */}
        <td
          className="asn-link"
          onClick={() => setSelectedProduct(item)}
        >
                {item.asn_no}
              </td>
              <td>{item.received_from}</td>
              
            </tr>
          ))}
        </tbody>
      </table>

      {/* ASN Details Popup */}
  {selectedProduct && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>ASN Product Details</h3>

      <p><strong>Products:</strong></p>
      <ul>
        {selectedProduct.products
          .split(",") // split by comma
          .map((p, index) => {
            // Extract name and quantity using regex
            const match = p.trim().match(/^(.+?)\s*\((\d+)\)$/);
            if (match) {
              const name = match[1];
              const quantity = match[2];
              return (
                <li key={index}>
                 <span style={{ color: "blue" }}>Pro Name:</span> {name},<span style={{ color: "blue" }}>Quantity:</span>  {quantity}
                </li>
              );
            }
            return <li key={index}>{p.trim()}</li>; // fallback
          })}
      </ul>

      <button
        className="close-btn"
        onClick={() => setSelectedProduct(null)}
      >
        Close
      </button>
    </div>
  </div>
)}

      {/* Upload Popup */}
      {showUpload && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Upload Shipment (Excel)</h3>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <div className="upload-actions">
              <button className="close-btn" onClick={handleUpload}>
                Upload
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowUpload(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipment;
