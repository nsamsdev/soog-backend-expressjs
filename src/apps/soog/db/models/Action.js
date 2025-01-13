import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const Action = sequelizeSoog.define(
  "Action",
  {
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    originName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actionType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    actionContent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: "actions",
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

export default Action;
