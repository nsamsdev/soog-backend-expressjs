import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const Ticket = sequelizeSoog.define(
  "Ticket",
  {
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    adminUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isArchived: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "new",
    },
    importance: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "standard",
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: "tickets",
    // Define the default scope
    defaultScope: {
      where: {
        isDeleted: 0,
      },
    },
    // Additional scopes
    scopes: {
      withDeleted: {}, // Include all records, even those where isDeleted = 1
    },
  }
);

export default Ticket;
