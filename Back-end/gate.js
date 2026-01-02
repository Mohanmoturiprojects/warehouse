import express from "express";
import { Gate } from "./models/gate.js";
import { RecProducts } from "./models/products.js";
import { Inventory } from "./models/inventory.js";
import sequelize from "./models/db.js";
import { fn, col, where , Op} from "sequelize";


const gateInRoute = express.Router();
   gateInRoute.post("/add", async (req, res) => {
  try {
    const { vehicle_no, dname, supplier } = req.body;

    // Validation
    if (!vehicle_no || !dname || !supplier) {
      return res.status(400).json({
        message: "vehicle_no, dname, and supplier are required",
      });
    }

    // Create gate entry
    const gateEntry = await Gate.create({
      vehicle_no,
      dname,
      supplier,
      
    });

    res.status(201).json({
      message: "Gate entry created successfully",
      data: gateEntry,
    });
  } catch (error) {
    console.error("Gate insert error:", error);
    res.status(500).json({
      message: "Failed to create gate entry",
    });
  }
});

  gateInRoute.get("/get", async (req, res) => {
  try {
    const gateList = await Gate.findAll({
      order: [["received_at", "DESC"]],
    });

    res.json({
      message: "Gate entries fetched successfully",
      count: gateList.length,
      data: gateList,
    });
  } catch (error) {
    console.error("Gate fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch gate entries",
    });
  }
});



gateInRoute.post("/receive", async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { vehicle_no, items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Items are required" });
    }

    for (const item of items) {
      const { product_name, asn_qty, received_qty, location } = item;

      if (!product_name || asn_qty == null || received_qty == null || !location) {
        throw new Error("Invalid item data");
      }

      // ✅ DEFINE IT HERE
      const normalizedProduct = product_name.trim().toLowerCase();

      /* ================= INVENTORY ================= */
      const inv = await Inventory.findOne({
        where: { location },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!inv) {
        throw new Error(`Location ${location} not found`);
      }

     
    if (
  inv.product_name &&
  inv.product_name.trim().toLowerCase() !==
    product_name.trim().toLowerCase()
) {
  throw new Error(
    `Location ${location} already has ${inv.product_name}`
  );
}

      const newQty = inv.qty + received_qty;

      if (newQty > inv.max_qty) {
        throw new Error(`Location ${location} capacity exceeded`);
      }

      await inv.update(
        {
          product_name: normalizedProduct,
          qty: newQty,
        },
        { transaction }
      );

      /* ================= RECEIVED PRODUCTS ================= */
      const existingRec = await RecProducts.findOne({
        where: {
          location,
          [Op.and]: [
            where(
              fn("LOWER", col("product_name")),
              normalizedProduct
            ),
          ],
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existingRec) {
        await existingRec.update(
          {
            received_qty: existingRec.received_qty + received_qty,
            asn_qty: existingRec.asn_qty + asn_qty,
            vehicle_no,
          },
          { transaction }
        );
      } else {
        await RecProducts.create(
          {
            vehicle_no,
            product_name: normalizedProduct,
            asn_qty,
            received_qty,
            location,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    res.status(201).json({
      message: "Gate In successful (inventory & received products updated)",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Receive error:", error.message);
    res.status(500).json({ message: error.message || "Gate In failed" });
  }
});


  gateInRoute.get("/received", async (req, res) => {
  try {
    const data = await RecProducts.findAll({
      order: [["received_at", "DESC"]],
    });

    res.json({
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Fetch received error:", error);
    res.status(500).json({
      message: "Failed to fetch received products",
    });
  }
});




export default gateInRoute;