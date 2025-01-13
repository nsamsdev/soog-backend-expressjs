import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const Membership = sequelizeSoog.define(
  "Membership",
  {
    adminUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    membershipLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    linkedMembershipId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    numberOfProjects: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    numberOfTasks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    numberOfJournals: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    numberOfFiles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    numberOfUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    timestamps: true,
    tableName: "memberships",
    // Define the default scope
    defaultScope: {
      where: {
        isDeleted: 0,
//        status: "active",
      },
    },
    // Additional scopes
    scopes: {
      withDeleted: {}, // Include all records, even those where isDeleted = 1
    },
  }
);

export default Membership;
