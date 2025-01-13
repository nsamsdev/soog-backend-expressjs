import bcrypt from "bcryptjs";

export default class Hasher {
  constructor(data, hashNow = true) {
    this._data = data;
    if (hashNow) {
      this._hash = bcrypt.hashSync(this._data, bcrypt.genSaltSync(10));
    } else {
      this._hash = "";
    }
  }

  getHash() {
    return this._hash;
  }

  validateHashMatch(hash) {
    return bcrypt.compareSync(this._data, hash);
  }
}
