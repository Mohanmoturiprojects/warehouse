import React, { useEffect, useState } from "react";
import "./Gatein.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Gatein = () => {
  const [gateData, setGateData] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [loading, setLoading] = useState(false);

  const [asnList, setAsnList] = useState([]);
  const [selectedASN, setSelectedASN] = useState("");

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const [showGateForm, setShowGateForm] = useState(false);

  const [productLocations, setProductLocations] = useState({});

  const [receivedVehicles, setReceivedVehicles] = useState([]);

  const [gateForm, setGateForm] = useState({
    vehicle_no: "",
    dname: "",
    supplier: "",
  });

  /*  NEW STATE FOR OUTBOUND  */
  const [tripDetails, setTripDetails] = useState({
    start_location: "",
    destination: "",
    start_date: "",
    expected_arrival_date: "",
    driver_name: "",
    license_no: "",
  });

  const [outProducts, setOutProducts] = useState([]);
  const [startLocations, setStartLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  /*  LOAD RECEIVED VEHICLES */
  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("receivedVehicles") || "[]"
    );
    setReceivedVehicles(stored);
  }, []);

  /*  FETCH GATE*/
  const fetchGateData = async () => {
    const res = await fetch("http://localhost:5989/gate/get");
    const result = await res.json();
    setGateData(result.data || []);
  };

  useEffect(() => {
    fetchGateData();
  }, []);

  /*  ADD GATE */
  const submitGateIn = async () => {
    if (!gateForm.vehicle_no || !gateForm.dname || !gateForm.supplier) {
      toast.error("All fields are requried");
      return;
    }

    try {
      const res = await fetch("http://localhost:5989/gate/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gateForm),
      });

      if (!res.ok) throw new Error();

      toast.success("Gate In created successfully ✅");
      setShowGateForm(false);
      setGateForm({ vehicle_no: "", dname: "", supplier: "" });
      fetchGateData();
    } catch {
      toast.error("Failed to create Gate In");
    }
  };

  /* FETCH ASN LIST  */
  const fetchASNList = async () => {
    try {
      const res = await fetch("http://localhost:5989/shipment/asn-list");
      const result = await res.json();
      setAsnList(result || []);
    } catch {
      toast.error("Failed to load ASN list");
    }
  };

  /*  FETCH LOCATIONS (INBOUND)  */
  const fetchLocations = async () => {
    try {
      const res = await fetch("http://localhost:5989/inventory/available");
      const result = await res.json();
      setLocations(result.data || []);
    } catch {
      toast.error("Failed to load locations");
    }
  };

  /* LOAD ASN PRODUCTS (INBOUND)*/
  const loadASNProducts = async (asn) => {
    try {
      const res = await fetch(
        `http://localhost:5989/shipment/asn-products/${asn}`
      );
      const result = await res.json();

      const formatted = result.map((p) => ({
        product_name: p.product_name,
        asn_qty: p.asn_qty,
        received_qty: "",
        location: "",
      }));

      setProducts(formatted);
    } catch {
      toast.error("Failed to load ASN products");
    }
  };

  /*SUBMIT GATE RECEIVE (INBOUND)  */
  const submitGateReceive = async () => {
    if (loading) return;

    if (!selectedGate || products.length === 0) {
      toast.error("Invalid submission");
      return;
    }

    for (let p of products) {
      if (!p.received_qty || !p.location) {
        toast.error("Fill all product details");
        return;
      }
    }

    const payload = {
      vehicle_no: selectedGate.vehicle_no,
      items: products.map((p) => ({
        product_name: p.product_name,
        asn_qty: p.asn_qty,
        received_qty: Number(p.received_qty),
        location: p.location,
      })),
    };

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5989/gate/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success(data.message);

      const updated = [
        ...new Set([...receivedVehicles, selectedGate.vehicle_no]),
      ];
      setReceivedVehicles(updated);
      localStorage.setItem("receivedVehicles", JSON.stringify(updated));

      setShowSidebar(false);
      setSelectedASN("");
      setProducts([]);
    } catch (err) {
      toast.error(err.message || "Receive failed");
    } finally {
      setLoading(false);
    }
  };

  /* OUTBOUND HELPERS  */

  const isInboundASN = (asn) => asn?.startsWith("ASN-");
const isOutboundASN = (asn) => asn?.startsWith("OUT-");

// 🔹 Fetch warehouse start locations
const fetchStartLocations = async () => {
  try {
    const res = await fetch("http://localhost:5989/outbound/whouse");
    const result = await res.json();
    setStartLocations(result.data || []);
  } catch {
    toast.error("Failed to load start locations");
  }
};

// 🔹 Fetch locations ONLY based on product
const fetchLocationsForProduct = async (productName) => {
  if (!productName) return;

  // prevent duplicate API calls
  if (productLocations[productName]) return;

  try {
    const res = await fetch(
      `http://localhost:5989/outbound/loc/${encodeURIComponent(productName)}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch locations");
    }

    const result = await res.json();

   

    setProductLocations((prev) => ({
      ...prev,
      [productName]: result,
    }));
  } catch (err) {
    console.error(err);
    toast.error("Failed to load locations for product");
  }
};



  const loadOutboundProducts = async (outNo) => {
    try {
      const res = await fetch(
        `http://localhost:5989/shipment/asn-products/${outNo}`
      );
      const result = await res.json();

      const formatted = (result || []).map((p) => ({
       product_name: p.product_name,
      asn_qty: p.asn_qty,
       splits: [
        {
         location: "",
          qty: p.asn_qty,
         },
          ],
        }));


      setOutProducts(formatted);

      // prefetch locations for each product name 
      formatted.forEach((p) => {
        fetchLocationsForProduct(p.product_name);
      });
    } catch (err) {
      toast.error("Failed to load outbound products");
    }
  };

  const submitGateOut = async () => {
  if (loading) return;

  const {
    start_location,
    destination,
    start_date,
    expected_arrival_date,
    driver_name,
    license_no,
  } = tripDetails;

  // 1️⃣ Trip validation
  if (
    !start_location ||
    !destination ||
    !start_date ||
    !expected_arrival_date ||
    !driver_name ||
    !license_no
  ) {
    toast.error("Fill all trip details");
    return;
  }

  // 2️⃣ PRODUCT VALIDATION (IMPORTANT FIX)
  for (let p of outProducts) {
    for (let s of p.splits) {
      if (!s.location) {
        toast.error(`Select location for ${p.product_name}`);
        return;
      }

      if (!s.qty || Number(s.qty) <= 0) {
        toast.error(`Enter valid quantity for ${p.product_name}`);
        return;
      }
    }

    const totalQty = p.splits.reduce(
      (sum, x) => sum + Number(x.qty),
      0
    );

    if (totalQty !== p.asn_qty) {
      toast.error(
        `Quantity mismatch for ${p.product_name}. Remaining should be 0`
      );
      return;
    }
  }


  const payload = {
    vehicle_no: selectedGate.vehicle_no,
    asn_no: selectedASN,
    trip: tripDetails,
    products: outProducts.flatMap((p) =>
      p.splits.map((s) => ({
        product_name: p.product_name,
        qty: Number(s.qty), 
        location: s.location,
      }))
    ),
  };


  try {
    setLoading(true);

    const res = await fetch("http://localhost:5989/outbound/outadd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || "Outbound failed");
    }

    toast.success("Outbound trip scheduled successfully ✅");

    // UI reset
    const updated = [
      ...new Set([...receivedVehicles, selectedGate.vehicle_no]),
    ];
    setReceivedVehicles(updated);
    localStorage.setItem("receivedVehicles", JSON.stringify(updated));

    setShowSidebar(false);
    setSelectedASN("");
    setOutProducts([]);
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Outbound submit failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="gate-container">
      <ToastContainer position="bottom-right" autoClose={3000} />

      
      <div className="gate-header">
        <h2>Gate In</h2>
        <button className="add-btn" onClick={() => setShowGateForm(true)}>
          + Gate In
        </button>
      </div>

      {showGateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Gate In Entry</h3>

            <input
              placeholder="Vehicle No"
              value={gateForm.vehicle_no}
              onChange={(e) =>
                setGateForm({ ...gateForm, vehicle_no: e.target.value })
              }
            />
            <input
              placeholder="Driver Name"
              value={gateForm.dname}
              onChange={(e) =>
                setGateForm({ ...gateForm, dname: e.target.value })
              }
            />
            <input
              placeholder="Supplier"
              value={gateForm.supplier}
              onChange={(e) =>
                setGateForm({ ...gateForm, supplier: e.target.value })
              }
            />

            <div className="modal-actions">
              <button className="save-btn" onClick={submitGateIn}>
                Save
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowGateForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      
      <table className="gate-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehicle No</th>
            <th>Driver</th>
            <th>Supplier</th>
            <th>Received At</th>
          </tr>
        </thead>
        <tbody>
          {gateData.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td
                className={`vehicle-link ${
                  receivedVehicles.includes(row.vehicle_no)
                    ? "disabled-link"
                    : ""
                }`}
                onClick={() => {
                  if (receivedVehicles.includes(row.vehicle_no)) return;
                  setSelectedGate(row);
                  setShowSidebar(true);
                  fetchASNList();
                  fetchLocations();
                  setSelectedASN("");
                  setProducts([]);
                  setOutProducts([]);
                  setProductLocations({});
                }}
              >
                {row.vehicle_no}
              </td>
              <td>{row.dname}</td>
              <td>{row.supplier}</td>
              <td>{new Date(row.received_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      
     {showSidebar && (
        <div className="sidebar">
           {/* Header */}
          <div className="sidebar-header">
      <h3>
        {isOutboundASN(selectedASN) ? "Outbound Trip" : "Gate Receive"}
      </h3>

      {/* Close button */}
      <span
        className="sidebar-close"
        onClick={() => setShowSidebar(false)}
        title="Close"
      >
        ✖
      </span>
    </div>

    <label>Vehicle No</label>
    <input value={selectedGate?.vehicle_no || ""} disabled />

    <label>ASN No</label>
    <select
      value={selectedASN}
      onChange={(e) => {
        const value = e.target.value;
        setSelectedASN(value);

        if (isInboundASN(value)) {
          loadASNProducts(value);
          fetchLocations();
          setOutProducts([]);
          setProductLocations({});
        } else if (isOutboundASN(value)) {
          setProducts([]);
          fetchStartLocations();
          loadOutboundProducts(value);
        } else {
          setProducts([]);
          setOutProducts([]);
          setProductLocations({});
        }
      }}
    >
     

            <option value="">Select ASN</option>
            {asnList.map((row) => (
              <option key={row.asn_no} value={row.asn_no}>
                {row.asn_no}
              </option>
            ))}
          </select>

          {/* INBOUND FORM */}
          {isInboundASN(selectedASN) &&
            products.map((p, index) => (
              <div key={index} className="product-box">
                <label>Product Name</label>
                <input value={p.product_name} disabled />

                <label>ASN Quantity</label>
                <input value={p.asn_qty} disabled />

                <label>Received Quantity</label>
                <input
                  type="number"
                  value={p.received_qty}
                  onChange={(e) => {
                    const updated = [...products];
                    updated[index].received_qty = e.target.value;
                    setProducts(updated);
                  }}
                />

                <label>Location</label>
                <select
                  value={p.location}
                  onChange={(e) => {
                    const updated = [...products];
                    updated[index].location = e.target.value;
                    setProducts(updated);
                  }}
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.location} value={l.location}>
                      {l.location} (Available {l.max_qty - l.qty})
                    </option>
                  ))}
                </select>

                <hr />
              </div>
            ))}

          {/* OUTBOUND FORM */}
          {isOutboundASN(selectedASN) && (
            <div className="outbound-wrapper">
              <div className="card-section">
                <div className="card-header">
                  <span className="card-step">1</span>
                  <div>
                    <h4>Trip Details</h4>
                    <p>Configure route and timing</p>
                  </div>
                </div>

                <div className="row-2">
                  <div className="field">
                    <label>Start Location</label>
                    <select
                      value={tripDetails.start_location}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          start_location: e.target.value,
                        })
                      }
                    >
                      <option value="">Select start location</option>
                      {startLocations.map((wh) => (
                        <option key={wh.id} value={wh.whname}>
                          {wh.whname} ({wh.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Destination</label>
                    <input
                      value={tripDetails.destination}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          destination: e.target.value,
                        })
                      }
                      placeholder="Enter destination warehouse"
                    />
                  </div>
                </div>

                <div className="row-2">
                  <div className="field">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={tripDetails.start_date}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Expected Delevery Date</label>
                    <input
                      type="date"
                      value={tripDetails.expected_arrival_date}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          expected_arrival_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="row-2">
                  <div className="field">
                    <label>Driver Name</label>
                    <input
                      value={tripDetails.driver_name}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          driver_name: e.target.value,
                        })
                      }
                      placeholder="Enter driver name"
                    />
                  </div>

                  <div className="field">
                    <label>Licence No</label>
                    <input
                      value={tripDetails.license_no}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          license_no: e.target.value,
                        })
                      }
                      placeholder="Enter licence no"
                    />
                  </div>
                </div>
              </div>

              {/* PRODUCTS BLOCK */}
              <div className="card-section">
                <div className="card-header">
                  <span className="card-step">2</span>
                  <div>
                    <h4>Products</h4>
                    <p>Outbound products and locations</p>
                  </div>
                </div>

               {outProducts.map((p, index) => {
               const locsForProduct =
               productLocations[p.product_name] || [];

               const totalAssigned = p.splits.reduce(
               (sum, s) => sum + Number(s.qty || 0),  0 );

              const remaining = p.asn_qty - totalAssigned;
              
                return (
                    <div key={index} className="product-box">
                  
                    <div className="row-2">
                    <div className="field">
                     <label>Product Name</label>
                    <input value={p.product_name} disabled />
                  </div>

                   <div className="field">
                      <label>Total Quantity</label>
                       <input value={p.asn_qty} disabled />
                    </div>
                 </div>

          {/* Location splits */}
              {p.splits.map((s, sIndex) => (
              <div className="row-1" key={sIndex}>
               <div className="field">
               <label>Location</label>

              <select
            value={s.location}
            onFocus={() => fetchLocationsForProduct(p.product_name)}
            onChange={(e) => {
              const updated = [...outProducts];
              updated[index].splits[sIndex].location = e.target.value;
              setOutProducts(updated);
            }}
          >
            <option value="">Select location</option>

            {locsForProduct.map((l) => (
              <option key={l.location} value={l.location}>
                {l.location} (Available: {l.qty})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Qty</label>
          <input
            type="number"
            min="1"
            value={s.qty}
            onChange={(e) => {
              const updated = [...outProducts];
              updated[index].splits[sIndex].qty = Number(e.target.value);
              setOutProducts(updated);
            }}
          />
        </div>
      </div>
     ))}

             {/* Remaining qty */}
            {(() => {
            const used = p.splits.reduce((sum, x) => sum + Number(x.qty || 0), 0);
            const remaining = p.asn_qty - used;

                return (
                   remaining > 0 && (
                   <button
                  className="add-btn"
                  onClick={() => {
                  const updated = [...outProducts];
                 updated[index].splits.push({
                location: "",
                qty: remaining,
              });
              setOutProducts(updated);
            }}
             >
             + Add Location ({remaining} left)
                 </button>
              )
             );
          })()}
           </div>
         );

                })}

                <div className="sidebar-actions">
                  <button
                    className="save-btn"
                    onClick={submitGateOut}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Submit"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowSidebar(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Common actions for inbound when ASN selected */}
          {isInboundASN(selectedASN) && (
            <div className="sidebar-actions">
              <button className="save-btn" onClick={submitGateReceive}>
                Submit
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowSidebar(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Gatein;
