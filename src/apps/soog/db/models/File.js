import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const File = sequelizeSoog.define(
  "File",
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
    liveUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    info: {
      type: DataTypes.JSON,
      allowNull: false,
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
    tableName: "files",
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

export default File;
