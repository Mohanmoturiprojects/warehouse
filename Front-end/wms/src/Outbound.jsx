import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Outbound.css";

const Outbound = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [selectedASN, setSelectedASN] = useState(null);

  const fileInputRef = useRef(null);

  // 🔹 Fetch outbound list
  const fetchOutboundShipments = async () => {
    try {
      const res = await axios.get("http://localhost:5989/outbound/list");
      setShipments(res.data.data || []);
    } catch (err) {
      console.error("Fetch outbound error:", err);
      alert("Failed to fetch outbound shipments");
    }
  };

  useEffect(() => {
    fetchOutboundShipments();
  }, []);

  // 🔹 Upload Excel
  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5989/outbound/add-excel",
        formData
      );

      alert(res.data.message || "Outbound uploaded successfully");

      setShowUpload(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      fetchOutboundShipments(); 
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Upload failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outbound-container">
      {/* Header */}
      <div className="outbound-header">
        <h1>Outbound Shipments</h1>
        <button className="add-btn" onClick={() => setShowUpload(true)}>
          + Add Outbound
        </button>
      </div>

      {/* Table */}
      <table className="shipment-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>ASN No</th>
            <th>Vehicle No</th>
            <th>Driver Name</th>
            <th>License No</th>
            <th>Start Location</th>
            <th>Destination</th>
            <th>Start Date</th>
            <th>Expected Arrival</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((item, index) => (
            <tr key={item.asn_no}>
              <td>{index + 1}</td>
              <td
                className="asn-link"
                onClick={() => setSelectedASN(item)}
              >
                {item.asn_no}
              </td>
              <td>{item.vehicle_no}</td>
              <td>{item.driver_name}</td>
              <td>{item.license_no}</td>
              <td>{item.start_location}</td>
              <td>{item.destination}</td>
              <td>{item.start_date}</td>
              <td>{item.expected_arrival_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ASN Product Popup */}
      {selectedASN && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Outbound Product Details</h3>

            <ul>
              {selectedASN.products
                .split(",")
                .map((p, index) => {
                  const match = p.trim().match(/^(.+?)\s*\((\d+)\)$/);
                  if (match) {
                    return (
                      <li key={index}>
                        <strong>{match[1]}</strong> – Qty: {match[2]}
                      </li>
                    );
                  }
                  return <li key={index}>{p}</li>;
                })}
            </ul>

            <button
              className="close-btn"
              onClick={() => setSelectedASN(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Upload Outbound (Excel)</h3>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <div className="upload-actions">
              <button
                className="submit-btn"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Submit"}
              </button>

              <button
                className="cancel-btn"
                onClick={() => {
                  setShowUpload(false);
                  setFile(null);
                }}
                disabled={loading}
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

export default Outbound;
