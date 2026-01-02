import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import { ASNProduct } from "./models/asnproduct.js";
import sequelize from "./models/db.js"; // instance of Sequelize

const shiroute = express.Router();


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

/* ---------------- 1️⃣ ADD SINGLE PRODUCT (JSON) ---------------- */
shiroute.post("/add", async (req, res) => {
  try {
    const { asn_no, product_name, quantity, received_from, price } = req.body;

    if (!asn_no || !product_name || !quantity || !received_from || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const record = await ASNProduct.create({
      asn_no,
      product_name,
      quantity,
      received_from,
      price,
    });

    res.status(201).json({
      message: "ASN Product added successfully",
      data: record,
    });
  } catch (error) {
    console.error("ASN Insert Error:", error);
    res.status(500).json({
      message: "Failed to insert ASN product",
      error: error.message,
    });
  }
});

/* ---------------- 2️⃣ ADD PRODUCTS USING EXCEL ---------------- */
  shiroute.post("/add-excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // 👉 Read as array of arrays (NO header assumptions)
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    if (rows.length < 2) {
      return res.status(400).json({ message: "Excel file is empty" });
    }


    let lastAsnNo = null;
    let lastReceivedFrom = null;
    const formattedRows = [];

    // ⏩ Start from row 2 (skip header)
    for (let i = 1; i < rows.length; i++) {
      const [
        asn_no,
        product_name,
        quantity,
        received_from,
        price,
      ] = rows[i];

      // Skip completely empty rows
      if (
        !asn_no &&
        !product_name &&
        !quantity &&
        !received_from &&
        !price
      ) {
        continue;
      }

      // ASN (mandatory for first product)
      if (asn_no && asn_no.toString().trim()) {
        lastAsnNo = asn_no.toString().trim();
      } else if (!lastAsnNo) {
        throw new Error(`ASN No missing at row ${i + 1}`);
      }

      // Received From (optional but auto-fill)
      if (received_from && received_from.toString().trim()) {
        lastReceivedFrom = received_from.toString().trim();
      }

      // Validations
      if (!product_name || !product_name.toString().trim()) {
        throw new Error(`Product name missing at row ${i + 1}`);
      }

      if (!quantity || Number(quantity) <= 0) {
        throw new Error(`Invalid quantity at row ${i + 1}`);
      }

      if (!price || Number(price) <= 0) {
        throw new Error(`Invalid price at row ${i + 1}`);
      }

      formattedRows.push({
        asn_no: lastAsnNo,
        product_name: product_name.toString().trim(),
        quantity: Number(quantity),
        received_from: lastReceivedFrom || null,
        price: Number(price),
        location: null, // ✅ safe (allows NULL)
      });
    }

    if (!formattedRows.length) {
      return res.status(400).json({
        message: "No valid data found in Excel file",
      });
    }

    await ASNProduct.bulkCreate(formattedRows, { validate: true });

    res.status(201).json({
      message: "Excel uploaded successfully ✅",
      asn_no: lastAsnNo,
      totalInserted: formattedRows.length,
    });
  } catch (error) {
    console.error("Excel Upload Error:", error.message);
    res.status(400).json({
      message: "Failed to upload Excel",
      error: error.message,
    });
  }
});

/* ---------------- 3️⃣ LIST PRODUCTS ---------------- */
  shiroute.get("/list", async (req, res) => {
  try {
    const data = await sequelize.query(
      `
      SELECT 
        asn_no,
        received_from,
        GROUP_CONCAT(
          CONCAT(product_name, ' (', quantity, ')')
          ORDER BY product_name
        ) AS products
      FROM asnproducts
      GROUP BY asn_no, received_from
      ORDER BY asn_no;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      message: "ASN products fetched successfully",
      data,
    });
  } catch (error) {
    console.error("ASN Fetch Error:", error);
    res.status(500).json({
      message: "Failed to fetch ASN products",
      error: error.message,
    });
  }
});

   shiroute.get("/asn-list", async (req, res) => {
  try {
    const data = await sequelize.query(
      `
      SELECT DISTINCT asn_no
      FROM asnproducts
      ORDER BY asn_no;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch ASN list",
      error: error.message,
    });
  }
});

  shiroute.get("/asn-products/:asn_no", async (req, res) => {
  try {
    const { asn_no } = req.params;

    const data = await sequelize.query(
      `
      SELECT 
        product_name,
        quantity AS asn_qty
      FROM asnproducts
      WHERE asn_no = ?
      `,
      {
        replacements: [asn_no],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch ASN products",
      error: error.message,
    });
  }
});

export default shiroute;
