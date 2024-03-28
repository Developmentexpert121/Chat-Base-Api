const express = require("express");
const router = express.Router();
// const request = require("request");
const utils = require("../../config/utils");
var passport = require("passport");
const User = require("../../models").User;

/* Get user by ID or users list. */

router.get(
  "/:email?",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const query = {};
    if (req.query && req.query.email) {
      query.where = query.where || {};

      query.where.email = req.query.email;
      query.where.id = req.user.id;
    }

    User.findAndCountAll(query)
      .then((users) => {
        res.json({ success: true, data: users.rows, count: users.count });
      })
      .catch(next);
  }
);

/* Add new user. */

router.post("/", function (req, res, next) {
  if (!req.body.email) return next(new Error("missing_email"));
  if (!req.body.password) return next(new Error("missing_password"));
  let newData = {
    password: User.generateHash(req.body.password),
  };

  utils.validateQuery(req.body, newData, "email");
  utils.validateQuery(req.body, newData, "firstName");
  utils.validateQuery(req.body, newData, "lastName");

  if (newData.errors) {
    return next(newData.errors[0]);
  }
  if (req.body.newUserAccessAuthorized) {
    newData.isRestricted = true;
  }

  User.create(newData)
    .then((user) => {
      User.update({ createdBy: user.id }, { where: { id: user.id } })
        .then(() => {
          res.json({ success: true, data: user });
        })
        .catch(next);
    })
    .catch(next);
});

/* Update Client with U */

router.post(
  "/updateUser",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    let userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      isRestricted: req.body.isRestricted,
    };
    User.update(userData, { where: { id: req.body.clientId } })
      .then(() => {
        res.json({ success: true, data: userData });
      })
      .catch(next);
  }
);

module.exports = router;
