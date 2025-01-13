import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const Journal = sequelizeSoog.define(
  "Journal",
  {
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    adminUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    importance: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "normal",
    },
    isArchived: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: "journals",
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

export default Journal;
