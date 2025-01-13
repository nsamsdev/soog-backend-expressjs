import { Sequelize } from "sequelize";

const sequelizeSoog = new Sequelize(
  process.env.SOOG_DB_DATABASE,
  process.env.SOOG_DB_USER,
  process.env.SOOG_DB_PASS,
  {
    host: process.env.SOOG_DB_HOST,
    dialect: process.env.SOOG_DB_DRIVER,
    logging: false,
    pool: {
      max: 15,
      min: 5,
      acquire: 30000,
      idle: 10000,
      evict: 15000,
    },
  }
);

export default sequelizeSoog;
