import { DataTypes } from "sequelize";
import sequelize from "./db.js";

export const RecProducts = sequelize.define(
  "received_products",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    vehicle_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    asn_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    received_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // auto insert date & time
    },
  },
  {
    tableName: "received_products",
    timestamps: false,
  }
);
