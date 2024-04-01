const express = require("express");
const router = express.Router();
const request = require("request");
const utils = require("../../config/utils");
var passport = require("passport");
const User = require("../../models").User;
const axios = require("axios");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const chatUsers = require("../../models").chatUsers;
const bcrypt = require("bcrypt");

/* Get user by ID or users list. */

// router.get(
//   "/:email?",
//   passport.authenticate("jwt", { session: false }),
//   async function (req, res, next) {
//     const query = {};
//     if (req.query && req.query.email) {
//       query.where = query.where || {};

//       query.where.email = req.query.email;
//       query.where.id = req.user.id;
//     }

//     User.findAndCountAll(query)
//       .then((users) => {
//         res.json({ success: true, data: users.rows, count: users.count });
//       })
//       .catch(next);
//   }
// );

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
router.post("/conversation", async function (req, res, next) {
  const data = {
    eventType: req.body.eventType,
    chatbotId: req.body.chatbotId,
    conversationId: req.body.payload.conversationId,
    customerEmail: req.body.payload.customerEmail,
    customerName: req.body.payload.customerName,
    customerPhone: req.body.payload.customerPhone,
  };
  chatUsers
    .create(data)
    .then((user) => {
      res.json({ success: true, data: user });
    })
    .catch(next);
});

router.get("/getAllUsers", async function (req, res, next) {
  User.findAll()
    .then((users) => {
      res.json({ success: true, data: users });
    })
    .catch(next);
});

router.get("/getAllChatbots", async function (req, res, next) {
  chatUsers
    .findAll()
    .then((chatusers) => {
      res.json({ success: true, data: chatusers });
    })
    .catch(next);
});

router.post(
  "/invite",
  // passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const user = await User.findOne({
        where: { email: req.body.email },
      });

      if (user) {
        return res.json({
          success: false,
          message: "Already sent invite to the user",
        });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: "587",
        auth: {
          user: "simranbleem@gmail.com",
          pass: "punl bnvr ltzy mdws",
        },
        secureConnection: "false",
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false,
        },
      });

      const verificationToken = crypto.randomBytes(20).toString("hex");

      const mailOptions = {
        to: req.body.email,
        from: "simranbleem@gmail.com",
        subject: "Sending Invite",
        chatbotId: req.body.chatbotId,
        text:
          `You are receiving this because you (or someone else) have invited to join the conversation from your account.\n\n` +
          `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
          `http://localhost:3000/signup/${verificationToken}\n\n` +
          `If you do not join this, please ignore this email .\n`,
      };

      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.error("Error sending invite email:", err);
          return next(err);
        }

        User.create({
          email: req.body.email.toLowerCase(),
          chatbotId: req.body.chatbotId,
          inviteEmailVerificationToken: verificationToken,
          inviteEmailVerificationExpires: Date.now() + 3600000,
        })
          .then((user) => {
            res
              .json({
                success: true,
                data: info,
                message: "Join email sent successfully",
              })
              .catch((err) => {
                return next(err);
              });
          })
          .catch((err) => {
            return next(err);
          });
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/updateUser/:token", async function (req, res, next) {
  try {
    const token = req.params.token;

    const user = await User.findOne({
      where: { inviteEmailVerificationToken: token },
    });

    if (!user) {
      return next(new Error("invalid_verification_token"));
    }
    if (user.email !== req.body.email) {
      return res.json({
        success: false,
        message: "Please enter the email address that recieved the invite",
      });
    }
    // Check if the token has expired
    if (user.inviteEmailVerificationExpires < Date.now()) {
      return next(new Error("reset_token_expired"));
    }

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.mobile = req.body.mobile;
    user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8));
    user.isRestricted = false;
    user.inviteEmailVerificationToken = null;
    user.inviteEmailVerificationExpires = null;
    await user.save();

    res.json({
      success: true,
      data: user,
      message: "User registered successfully",
    });
  } catch (e) {
    next(error);
  }
});

router.post("/getconversation", async function (req, res, next) {
  console.log("req.params.chatId ", req.params.chatId);
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: "Bearer 08f758ff-f39a-4dc3-940e-970bb2a0fbe3", //token app
      "Content-Type": "application/json",
      "x-api-key": "4ed4cab2-0424-4b69-979c-e04ff59ac760", //ngrox key
    },
  };
  const url = `https://www.chatbase.co/api/v1/get-conversations?chatbotId=${req.body.chatbotId}&startDate=${req.body.startDate}&endDate=${req.body.endDate}&page=${req.body.page}&size=${req.body.size}`;

  fetch(url, options)
    .then((response) => response.json())
    .then((response) => {
      res.json({ success: true, data: response });
    })
    .catch((err) => {
      res.json({ success: false, data: "error" });
    });
});

// router.get("/usersCountByDay", async function (req, res, next) {
//   console.log("GET /usersCountByDay44444444444444444444444")
//   try {
//     const userCounts = await chatUsers.aggregate([
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           count: { $sum: 1 }
//         }
//       }
//     ]);
//     const formattedCounts = userCounts.map(entry => ({ [entry._id]: entry.count }));
//     res.json(formattedCounts);
//   } catch (error) {
//     next(error);
//   }
// });
const { Op, Sequelize } = require("sequelize");
router.get("/usersCountByDay", async function (req, res, next) {
  try {
    const userCounts = await chatUsers.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("createdAt")), "createdAt"],
        [Sequelize.fn("COUNT", Sequelize.col("*")), "count"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("createdAt"))],
    });
    const formattedCounts = userCounts.map((entry) => ({
      [entry.createdAt]: entry.count,
    }));
    res.json({ success: true, data: formattedCounts }); // Send formattedCounts as data in response
  } catch (error) {
    next(error);
  }
});

module.exports = router;
