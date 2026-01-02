import express from "express";
import { Inventory } from "./models/inventory.js";
import { Op } from "sequelize";

const inventoryRoute = express.Router();


  inventoryRoute.get("/available", async (req, res) => {
  try {
    const locations = await Inventory.findAll({
      where: {
        status: {
          [Op.in]: ["USED", "EMPTY"],
        },
      },
      attributes: [
        "invid",
        "location",
        "product_name",
        "qty",
        "max_qty",
        "status",
      ],
      order: [["location", "ASC"]],
    });

    res.json({
      message: "Available locations fetched",
      data: locations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch locations",
    });
  }
});

   

 inventoryRoute.post("/add", async (req, res) => {
  try {
    const { location, max_qty } = req.body;

    if (!location || !max_qty) {
      return res.status(400).json({
        message: "Location and max_qty are required",
      });
    }

    // Prevent duplicate location
    const exists = await Inventory.findOne({
      where: { location },
    });

    if (exists) {
      return res.status(409).json({
        message: "Location already exists",
      });
    }

  const inv = await Inventory.create({
  location,
  max_qty,
  qty: 0,
  product_name: null,
  status: "EMPTY",
});

    res.status(201).json({
      message: "Location created successfully",
      data: inv,
    });
  } catch (error) {
    console.error("Inventory create error:", error);
    res.status(500).json({
      message: "Failed to create location",
    });
  }
});


   inventoryRoute.get("/fetch", async (req, res) => {
  try {
    const inventory = await Inventory.findAll({
      order: [["location", "ASC"]],
    });

    res.status(200).json({
      message: "Inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch inventory",
      error: error.message,
    });
   }
  });



export default inventoryRoute;