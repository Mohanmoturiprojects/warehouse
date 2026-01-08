import React, { useEffect, useState } from "react";
import "./Inventory.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    location: "",
    max_qty: "",
  });

  /* FETCH INVENTORY */
  const fetchInventory = async () => {
    try {
      const res = await fetch("http://localhost:5989/inventory/fetch");
      const result = await res.json();
      setInventory(result.data || []);
    } catch {
      toast.error("Failed to load inventory");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  /*  ADD LOCATION  */
  const submitLocation = async () => {
    if (!form.location || !form.max_qty) {
      toast.error("All fields are required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5989/inventory/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: form.location,
          max_qty: Number(form.max_qty),
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Location added successfully ✅");
      setShowModal(false);
      setForm({ location: "", max_qty: "" });
      fetchInventory();
    } catch {
      toast.error("Failed to add location");
    }
  };

  return (
    <div className="inventory-container">
      <ToastContainer position="bottom-right" autoClose={3000} />

      {/*  HEADER  */}
      <div className="inventory-header">
        <h2>Inventory</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Location
        </button>
      </div>

      {/*  TABLE */}
      <table className="inventory-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Location</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Max Qty</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inventory.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No inventory data
              </td>
            </tr>
          ) : (
            inventory.map((row) => (
              <tr key={row.id}>
                <td>{row.invid}</td>
                <td>{row.location}</td>
                <td>{row.product_name || "-"}</td>
                <td>{row.qty}</td>
                <td>{row.max_qty}</td>
                <td>
                  <span className={`status ${row.status?.toLowerCase()}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

     
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Location</h3>

            <input
              placeholder="Location (eg: A1)"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Max Quantity"
              value={form.max_qty}
              onChange={(e) =>
                setForm({ ...form, max_qty: e.target.value })
              }
            />

            <div className="modal-actions">
              <button className="save-btn" onClick={submitLocation}>
                Save
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
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

export default Inventory;
