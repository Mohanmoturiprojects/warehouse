import { DataTypes } from "sequelize";
import sequelize from "./db.js";

/**
 * Helper function to auto-set inventory status
 */
const setInventoryStatus = (inv) => {
  if (inv.qty === 0) {
    inv.status = "EMPTY";
  } else if (inv.qty < inv.max_qty) {
    inv.status = "USED";
  } else {
    inv.status = "BLOCKED";
  }
};

export const Inventory = sequelize.define(
  "inventory",
  {
    invid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    product_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    max_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("EMPTY", "USED", "BLOCKED"),
      allowNull: false,
    },
  },
  {
    tableName: "inventory",
    timestamps: false,

    hooks: {
      beforeCreate: setInventoryStatus,
      beforeUpdate: setInventoryStatus,
    },
  }
);
