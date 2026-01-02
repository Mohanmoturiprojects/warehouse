import { DataTypes } from "sequelize";
import sequelize from "./db.js";

export const Gate = sequelize.define(
  "gate",
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
    dname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "gate",
    timestamps: false,
  }
);
