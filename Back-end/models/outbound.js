import { DataTypes } from "sequelize";
import sequelize from "./db.js";

export const OutShipment = sequelize.define(
  "outbound_shipments",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    asn_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    vehicle_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    start_location: {
      type: DataTypes.STRING(255),
    },

    destination: {
      type: DataTypes.STRING(255),
    },

    start_date: {
      type: DataTypes.DATE,
    },

    expected_arrival_date: {
      type: DataTypes.DATE,
    },

    driver_name: {
      type: DataTypes.STRING(255),
    },

    license_no: {
      type: DataTypes.STRING(50),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, 
    },
  },
  {
    tableName: "out_shipments",
    timestamps: false,
  }
);
