import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const Task = sequelizeSoog.define(
  "Task",
  {
    projectId: {
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "draft",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    isArchived: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    goLive: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "tasks",
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

export default Task;
