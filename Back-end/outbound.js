import express from "express";
import { Op } from "sequelize";
import multer from "multer";
import XLSX from "xlsx";
import sequelize from "./models/db.js";
import { ASNProduct } from "./models/asnproduct.js";
import { WareHouse } from "./models/warehouse.js";
import { Inventory } from "./models/inventory.js";
import { OutShipment } from "./models/outbound.js";

const outRoute = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
});
  
  outRoute.post( "/add-excel", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Excel file is required" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      let rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      let lastAsnNo = null;
      let lastReceivedFrom = null;

      // 🔥 AUTO-GENERATE ASN IF MISSING
      const generatedAsn = `OUT-${Date.now()}`;

      const formattedRows = rows.map((row, index) => {
        const asn = row.asn_no?.toString().trim();

        // ✅ ASN handling (FIXED)
        if (asn) {
          lastAsnNo = asn;
        } else if (lastAsnNo) {
          row.asn_no = lastAsnNo;
        } else {
          // 🔥 Auto-generate ASN for outbound
          lastAsnNo = generatedAsn;
          row.asn_no = generatedAsn;
        }

        // RECEIVED_FROM
        const receivedFrom = row.received_from?.toString().trim();
        if (receivedFrom) {
          lastReceivedFrom = receivedFrom;
        }

        // VALIDATIONS
        if (!row.product_name?.toString().trim()) {
          throw new Error(`Product name missing at row ${index + 2}`);
        }

        if (!row.location?.toString().trim()) {
          throw new Error(`Location missing at row ${index + 2}`);
        }

        if (!row.quantity || Number(row.quantity) <= 0) {
          throw new Error(`Invalid quantity at row ${index + 2}`);
        }

        if (!row.price || Number(row.price) <= 0) {
          throw new Error(`Invalid price at row ${index + 2}`);
        }

        return {
          asn_no: lastAsnNo,
          product_name: row.product_name.toString().trim(),
          quantity: Number(row.quantity),
          price: Number(row.price),
          received_from: lastReceivedFrom || null,
          location: row.location.toString().trim(),
        };
      });

      await ASNProduct.bulkCreate(formattedRows, { validate: true });

      res.status(201).json({
        message: "Outbound Excel uploaded successfully",
        asn_no: lastAsnNo,
        totalInserted: formattedRows.length,
      });
    } catch (error) {
      console.error("Outbound Excel Error:", error.message);
      res.status(400).json({
        message: "Failed to upload outbound Excel",
        error: error.message,
      });
    }
  }
);


    outRoute.post("/addwh", async (req, res) => {
      try {
        const { whname, location } = req.body;
    
        if (!whname || !location ) {
          return res.status(400).json({ message: "All fields are required" });
        }
    
        const record = await WareHouse.create({
          whname,
          location
        });
    
        res.status(201).json({
          message: "ware house added successfully",
          data: record,
        });
      } catch (error) {
        console.error("ASN Insert Error:", error);
        res.status(500).json({
          message: "Failed to insert ware house ",
          error: error.message,
        });
      }
    });

       outRoute.get("/whouse", async (req, res) => {
         try {
           const wearhouse = await WareHouse.findAll({
             order: [["id", "ASC"]],
           });
       
           res.status(200).json({
             message: "wearhouse fetched successfully",
             data: wearhouse,
           });
         } catch (error) {
           console.error("wearhouse fetch error:", error);
           res.status(500).json({
             message: "Failed to fetch wearhouse",
             error: error.message,
           });
          }
         });

   outRoute.get("/loc/:product_name", async (req, res) => {
  try {
    const { product_name } = req.params;

    if (!product_name) {
      return res.status(400).json({
        message: "Product name is required",
      });
    }

    const locations = await Inventory.findAll({
      where: {
        product_name: {
          [Op.like]: product_name.trim(), 
        },
      },
      attributes: ["location", "qty"], 
      order: [["location", "ASC"]],
    });

    if (!locations.length) {
      return res.status(404).json({
        message: "No locations found for this product",
      });
    }

    res.status(200).json(locations);
  } catch (error) {
    console.error("Fetch Locations Error:", error);
    res.status(500).json({
      message: "Failed to fetch locations",
      error: error.message,
    });
  }
});

    outRoute.post("/outadd", async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { vehicle_no, asn_no, trip, products } = req.body;

    if (!vehicle_no || !asn_no || !trip || !products?.length) {
      return res.status(400).json({ message: "Invalid outbound payload" });
    }

    for (const p of products) {
      const { product_name, qty, location } = p;

      // 1️⃣ Check inventory
      const inventory = await Inventory.findOne({
        where: {
          product_name,
          location,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!inventory) {
        throw new Error(
          `Inventory not found for ${product_name} at ${location}`
        );
      }

      if (inventory.qty < qty) {
        throw new Error(
          `Insufficient qty for ${product_name} at ${location}`
        );
      }

      // 2️⃣ Reduce inventory qty
      inventory.qty -= qty;
      await inventory.save({ transaction });

      // 3️⃣ Insert outbound record
      await OutShipment.create(
        {
          asn_no,
          vehicle_no,
          product_name,
          location,
          qty,

          start_location: trip.start_location,
          destination: trip.destination,
          start_date: trip.start_date,
          expected_arrival_date: trip.expected_arrival_date,
          driver_name: trip.driver_name,
          license_no: trip.license_no,
        },
        { transaction }
      );
    }

    // 4️⃣ Commit transaction
    await transaction.commit();

    res.status(201).json({
      message: "Outbound shipment processed successfully",
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Outbound Error:", error);
    res.status(400).json({
      message: "Outbound failed",
      error: error.message,
    });
  }
});

    outRoute.get("/list", async (req, res) => {
  try {
    const data = await sequelize.query(
      `
      SELECT
        MIN(id) AS id,
        asn_no,
        MIN(vehicle_no) AS vehicle_no,
        MIN(driver_name) AS driver_name,
        MIN(license_no) AS license_no,
        MIN(start_location) AS start_location,
        MIN(destination) AS destination,
        MIN(start_date) AS start_date,
        MIN(expected_arrival_date) AS expected_arrival_date,

        GROUP_CONCAT(
          CONCAT(product_name, ' (', qty, ')')
          ORDER BY product_name
        ) AS products

      FROM out_shipments
      GROUP BY asn_no
      ORDER BY start_date DESC;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      message: "Outbound shipments fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Outbound Fetch Error:", error);
    res.status(500).json({
      message: "Failed to fetch outbound shipments",
      error: error.message,
    });
  }
});

   export default outRoute;
