const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
var passport = require("passport");

// Routes
const authRouter = require("./routes/core/standard-auth/auth");
const usersRouter = require("./routes/core/users");

// cron-manager
const Cron_Manager = require("./routes/standard/cron-manager/cron-manager");

const env = (process.env.NODE_ENV = process.env.NODE_ENV || "local");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    // origin: async (origin, callback) => {
    //   if (origin) {
    //     const protomatch = /^(https?|http):\/\//;
    //     const org = origin.replace(protomatch, "");
    //     const isWhitelisted = organisationUrl.indexOf(org) !== -1;
    //     callback(null, isWhitelisted);
    //   } else {
    //     const protomatch = /^(https?|http):\/\//;
    //     const org = "localhost";
    //     const isWhitelisted = organisationUrl.indexOf(org) !== -1;
    //     callback(null, isWhitelisted);
    //   }
    // },
    // credentials: true,
  })
);

app.use(passport.initialize());
require("./config/passport")(passport);

//Public routes
app.use("/api/auth", authRouter);

app.use("/api/users", /*roleMiddleware,*/ usersRouter);

/// Cron Manager
app.use(
  "/api/standard/cron_manager",
  passport.authenticate("jwt", { session: false }),
  Cron_Manager
);


// error handler, don't remove next
app.use(function (err, req, res, next) {
  let errorCode = "";

  switch (err.name) {
    case "TokenExpiredError":
      errorCode = "expired_token";
      break;

    case "JsonWebTokenError":
      errorCode = "invalid_token";
      break;

    case "SequelizeUniqueConstraintError":
      errorCode = "duplicated_" + Object.keys(err.fields)[0];
      break;

    case "SequelizeDatabaseError":
      errorCode = "invalid_inputs";
      break;

    default:
      errorCode = "unrecognized";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    errorCode = "INCORRECT_FILE_SIZE";
  }

  if (err.message) {
    errorCode = err.message;
  }

  res.json({
    success: false,
    error: {
      name: errorCode.toUpperCase(),
      message: err,
    },
  });
});


module.exports = app;
