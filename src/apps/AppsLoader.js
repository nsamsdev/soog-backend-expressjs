//import apps
import Soog from "./soog/Soog.js";

export default class AppsLoader {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.params = req.query;
    this.init();
  }

  init() {
    const appName = this.req.params.app ?? "";

    if (!this.getAppNames().includes(appName)) {
      return this.res.status(400).json({
        status: "error",
        message: "invalid app name",
      });
    }

    let app = null;

    switch (appName) {
      case "soog":
        app = new Soog(this.req, this.res);
        break;
      default:
        return this.res.status(400).json({
          status: "error",
          message: "no app was executed",
        });
    }

    app.run();
  }

  getAppNames() {
    return ["soog"];
  }
}
