import { StatusCodes } from "./StatusCodes.js";

import CustomError from "./CustomError.js";

export default class ValidationRules {
  constructor(nameInRequest, outputName, type, minLength, maxLength) {
    if (
      typeof nameInRequest != "string" ||
      typeof outputName != "string" ||
      typeof type != "string"
    ) {
      throw new CustomError(
        "Expecting string values for name, display and type",
        StatusCodes.SERVER_ERROR
      );
    }

    if (typeof minLength != "number" || typeof maxLength != "number") {
      throw new CustomError(
        "min and max need to be numbers",
        StatusCodes.SERVER_ERROR
      );
    }

    if (!this._getAllowedTypes().includes(type)) {
      throw new CustomError("Allowd types are: ", StatusCodes.SERVER_ERROR);
    }

    this._name = nameInRequest;
    this._displayName = outputName;
    this._type = type;
    this._min = minLength;
    this._max = maxLength;
  }

  _getAllowedTypes() {
    return ["string", "number", "email"];
  }

  getName() {
    return this._name;
  }

  getType() {
    return this._type;
  }

  getDisplayName() {
    return this._displayName;
  }

  getMaxLength() {
    return this._max;
  }

  getMinLength() {
    return this._min;
  }
}
