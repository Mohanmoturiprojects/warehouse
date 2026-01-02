import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import sequelize from "./models/db.js";
import { Users } from "./models/wuser.js";
import { OutShipment } from "./models/outbound.js";

import shipmentRoute from "./shipment.js";
import gateInRoute from "./gate.js";
import inventoryRoute from "./inventory.js";
import outRoute from "./outbound.js";

const app = express();
const PORT = 5989;


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
   

app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

  

app.use(express.urlencoded({ extended: true }));


app.use("/shipment", shipmentRoute);
app.use("/gate", gateInRoute);
app.use("/inventory", inventoryRoute);
app.use("/outbound", outRoute);


app.get("/", (req, res) => {
  res.send("🚀 Warehouse Backend is running");
});



app.post("/api/register", async (req, res) => {
  try {
    const { username, password, mobile } = req.body;

    if (!username || !password || !mobile) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await Users.findOne({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Users.create({
      username,
      password: hashedPassword,
      mobile,
    });

    res.status(201).json({
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Registration failed",
    });
  }
});

/* LOGIN */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Credentials required",
      });
    }

    const user = await Users.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
    });
  }
});


(async () => {
  try {
    await sequelize.sync();
    console.log("✅ Database tables synced");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start failed:", error);
  }
})();
