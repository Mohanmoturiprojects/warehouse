import { Sequelize } from "sequelize";

const sequelize = new Sequelize("logikal", "root", "Mohan@234", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

export default sequelize;
