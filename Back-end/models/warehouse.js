import { DataTypes } from "sequelize";
import sequelize from "./db.js";

export const WareHouse = sequelize.define(
  "Wear",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    whname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    }
},{
    tableName: "warehouse",
    timestamps: false,
  }
);