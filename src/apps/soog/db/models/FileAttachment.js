import { DataTypes, Op } from "sequelize";

import sequelizeSoog from "../sequelize.js";

const FileAttachment = sequelizeSoog.define(
  "FileAttachment",
  {
    attachedByUsedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attachedForName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    attachedForId: {
      type: DataTypes.INTEGER,
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
    tableName: "file_attachments",
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

export default FileAttachment;
