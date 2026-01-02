import { DataTypes } from "sequelize";
import sequelize from "./db.js";

export const ASNProduct = sequelize.define(
  "asnproducts",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    asn_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Inbound or Outbound ASN Number",
    },

    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    received_from: {
      type: DataTypes.STRING(255),
      allowNull: true,   
      comment: "Vendor (Inbound) OR WMS Location (Outbound)",
    },

    location: {
      type: DataTypes.STRING(50),
      allowNull: true,   
      comment: "WMS Location for outbound allocation",
    },
  },
  {
    timestamps: false,
    tableName: "asnproducts",
  }
);
