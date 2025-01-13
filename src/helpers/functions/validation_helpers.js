import moment from "moment";
export function mustHaveKey(obj, name) {
  if (!Object.hasOwn(obj, name)) {
    throw new Error(`${name} is missing`);
  }
}

export function mustHaveKeys(obj, keys) {
  if (typeof obj != "object" || Array.isArray(obj)) {
    throw new Error("expecting an object");
  }
  if (!Array.isArray(keys)) {
    throw new Error("keys must be an array");
  }

  for (let index = 0; index < keys.length; index++) {
    const name = keys[index];

    if (!Object.hasOwn(obj, name)) {
      throw new Error(`${name} is missing from object`);
    }
  }
}

export function tokenIsValid(token) {
  if (typeof token?.toJSON != "function") {
    return false;
  }

  const tokenType = token?.for;
  const createdAt = token?.createdAt;

  if (tokenType == "userActivation") {
    //24 hours
    const hours24Ago = moment().subtract(24, "hours");
    return moment(createdAt).isAfter(hours24Ago);
  }

  if (tokenType == "resetToken") {
    //24 hours
    const hours24Ago = moment().subtract(24, "hours");
    return moment(createdAt).isAfter(hours24Ago);
  }

  if (tokenType == "sessionToken") {
    //3 days
    const days3Ago = moment().subtract(3, "days");
    return moment(createdAt).isAfter(days3Ago);
  }

  if (tokenType == "longSessionToken") {
    //30 days
    const days30Ago = moment().subtract(30, "days");
    return moment(createdAt).isAfter(days30Ago);
  }

  return false;
}
