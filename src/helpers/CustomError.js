export default class CustomError extends Error {
  constructor(msg, StatusCode) {
    super(msg);
    this.errCode = StatusCode.customCode ?? 400;
  }
}
