import { Sequelize } from "sequelize";

const sequelizeGlobal = new Sequelize(
  process.env.GLOBAL_DB_DATABASE,
  process.env.GLOBAL_DB_USER,
  process.env.GLOBAL_DB_PASS,
  {
    host: process.env.GLOBAL_DB_HOST,
    dialect: process.env.GLOBAL_DB_DRIVER,
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

export default sequelizeGlobal;
