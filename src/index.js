import express from "express";
import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import AppsLoader from "./apps/AppsLoader.js";
import sequelizeSoog from "./apps/soog/db/sequelize.js";
import sequelizeGlobal from "./db/sequelize.js";
import permissionsPolicy from "permissions-policy";
import compression from "compression";


const appDbs = [sequelizeSoog, sequelizeGlobal];

//sync dbs
// Test the database connection
(async () => {
  for (let i = 0; i < appDbs.length; i++) {
    const sq = appDbs[i];

    try {
      await sq.authenticate();

      // Sync the models with the database
      await sq.sync({ alter: true, force: false }); // Use `force: true` to drop tables and recreate them
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  }
})();


const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 10 minutes
  max: 1000, // 100 requests per IP
  message: "Too many requests, please slow down",
});

const app = express();
// @todo check not sure if needed since im only accepting query params
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(compression());


//handle app errors mainly to do with body request parsing error
app.use(function (err, req, res, next) {
  // handle err
  if (err) {
    res.status(400).json({
      status: "error",
      message: err.message ?? "Invalid request",
    });
  } else {
    next();
  }
});

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(
  permissionsPolicy({
    features: {
      geolocation: ["self"],
      microphone: [],
      camera: [],
      fullscreen: ["self"],
      payment: [],
    },
  })
);


if (process.env.NODE_ENV === "production") {

  app.use(limiter); //limit number of requests
  app.use(
    helmet.hsts({
      maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    })
  );
}

app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));
app.disable("x-powered-by");// Remove X-Powered-By header
app.set('trust proxy', 1); // Trust the first proxy (Apache)
app.use(cors()); //protects from xss
app.use(hpp()); //protects from paramater polution

app.get("/", (req, res) => {
  res.status(301).json({
    message: "Please request the POST /api endpoint",
  });
});

//all actions are achieved via post request i.e get, patch, delete and post
app.all("/:app/:action", (req, res) => {
  new AppsLoader(req, res);
});

// app.listen(process.env.SERVER_PORT, () => {
//   console.log(`running on localhost:${process.env.SERVER_PORT}`);
// });

export default app;
