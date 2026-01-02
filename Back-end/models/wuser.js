import { DataTypes } from "sequelize";
import sequelize from "./db.js";

export const Users = sequelize.define("wuser", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "customer",
  },
}, {
  timestamps: false,
  tableName: "wuser",
});

