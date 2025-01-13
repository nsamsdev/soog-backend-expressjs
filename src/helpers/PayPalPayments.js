import ResetApiRequester from "./RestApiRequester.js";
import { mustHaveKeys } from "./functions/validation_helpers.js";
import CustomError from "./CustomError.js";

export default class PayPalPayments {
  #clientId;
  #secret;
  #accessToken;
  #authUrl;
  #authEndPoint;
  constructor(options) {
    this.#validateOptions(options);
  }

  #validateOptions(options) {
    mustHaveKeys(options, ["clientId", "secret", "authUrl", "authEndPoint"]);

    this.#clientId = options.clientId;
    this.#secret = options.secret;
    this.#authUrl = options.authUrl;
    this.#authEndPoint = options.authEndPoint;
  }

  setAccessToken(token) {
    this.#accessToken = token;
  }

  async getSubscription(subscriptionId, baseUrl, endPoint) {
    const response = await this.authenticate();

    if (!response.success) {
      return {
        success: false,
        error: "cant obtain access token",
      };
    }

    const accessToken = response.token;

    try {
      const requester = new ResetApiRequester(baseUrl.trim());

      const response = await requester
        .setHeaders({
          Authorization: `Bearer ${accessToken.trim()}`,
        })
        .setData({})
        .setMethod("GET")
        .setEndPoint(`${endPoint.trim()}/${subscriptionId.trim()}`)
        .execute();

      const data = response?.data;

      if (typeof data == "undefined") {
        return {
          success: false,
          error: "can get subscription",
        };
      } else {
        return {
          success: true,
          subscription: data,
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err?.message ?? "unkown error",
      };
    }
  }

  async getSubscriptionUrl(
    customId,
    subscriptionId,
    baseUrl,
    endPoint,
    returnUrl,
    cancelUrl
  ) {
    // console.log(arguments);
    const response = await this.authenticate();

    if (!response.success) {
      return {
        success: false,
        error: "no access token",
      };
    }

    //console.log("token:", response);

    const accessToken = response.token;

    try {
      const requester = new ResetApiRequester(baseUrl.trim());

      const response = await requester
        .setHeaders({
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken.trim()}`,
        })
        .setData({
          plan_id: subscriptionId.trim(),
          custom_id: customId, // Add the custom metadata here
          application_context: {
            return_url: returnUrl.trim(),
            cancel_url: cancelUrl.trim(),
            payment_method: {
              payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
            },
          },
        })
        .setMethod("POST")
        .setEndPoint(endPoint.trim())
        .execute();

      const data = response?.data;
      const approvalUrl = data.links.find(
        (link) => link.rel === "approve"
      ).href;

      return {
        success: true,
        url: approvalUrl,
      };
    } catch (error) {
      console.log("error is:", error);
      return {
        success: false,
        error: "Failed obtaining subscription",
      };
    }
  }

  async authenticate() {
    try {
      const requester = new ResetApiRequester(this.#authUrl);
      const response = await requester
        .setHeaders({
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${this.#clientId}:${this.#secret}`
          ).toString("base64")}`,
        })
        .setData({
          grant_type: "client_credentials",
        })
        .setMethod("POST")
        .setEndPoint(this.#authEndPoint)
        .execute();

      const accessToken = response?.data?.access_token;

      if (typeof accessToken != "undefined") {
        return {
          success: true,
          token: accessToken,
        };
      }

      return {
        success: false,
        error: "unable to obtain token from response",
      };
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }
}
