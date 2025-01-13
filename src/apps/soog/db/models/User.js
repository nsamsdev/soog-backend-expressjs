import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const User = sequelizeSoog.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    pass: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    isSuperAdmin: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    adminUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActivated: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    canCreateProject: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canUpdateProject: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canDeleteProject: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canCreateTask: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canEditTask: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canDeleteTask: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canCreateJournal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canEditJournal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canDeleteJournal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canUploadFile: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canDeleteFile: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canRequestSupport: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canSendMessages: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canViewDashboard: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    canArchive: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    timestamps: true,
    tableName: "users",
    indexes: [
      {
        unique: true,
        fields: ["email"], // Explicit unique index for the email field
      },
    ],
    // Define the default scope
    defaultScope: {
      where: {
        isDeleted: 0,
      },
    },
    // Additional scopes
    scopes: {
      withClosed: {}, // Include all records, even those where isClosed = 1
    },
  }
);

export default User;
