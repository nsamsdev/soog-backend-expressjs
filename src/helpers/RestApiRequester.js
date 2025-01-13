import axios from "axios";

export default class ResetApiRequester {
  #baseUrl;
  #endPoint;
  #method;
  #data;
  #headers;
  constructor(baseUrl) {
    this.#baseUrl = baseUrl;
  }

  setEndPoint(endPoint) {
    this.#endPoint = endPoint;
    return this;
  }

  setMethod(method) {
    const ACCEPTED_METHODS = ["GET", "POST", "PUT", "DELETE"];

    if (!ACCEPTED_METHODS.includes(method)) {
      throw new Error("Invalid method, only GET and POST");
    }
    this.#method = method;
    return this;
  }

  setData(data) {
    this.#data = data;
    return this;
  }

  setHeaders(headers) {
    this.#headers = headers;
    return this;
  }

  updateBaseUrl(url) {
    this.#baseUrl = url;
    return this;
  }

  async execute() {
    if (
      typeof this.#headers == "undefined" ||
      typeof this.#data == "undefined" ||
      typeof this.#method == "undefined" ||
      typeof this.#baseUrl == "undefined" ||
      typeof this.#endPoint == "undefined"
    ) {
      throw new Error("Please make sure all required fields are set");
    }
    this.axios = axios.create({
      baseURL: this.#baseUrl,
      method: this.#method,
      timeout: 5000, // Set a timeout (5 seconds in this case)
    });

    const response = await this.axios({
      url: this.#endPoint,
      data: this.#data,
      headers: this.#headers,
    });

    return response;
  }
}
