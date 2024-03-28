const router = require("express").Router();
const jwt = require("jsonwebtoken");
var passport = require("passport");
const User = require("../../../models").User;
const config = require("../../../config/config");
const jwtUtils = require("../../../utils/jwt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const path = require("path");
router.get(
  "/check-token",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var list = req.user;
    return res.send({ success: true, user: list });
  }
);

/* register api*/
router.post("/register", function (req, res, next) {
  console.log(req.body);
  if (!req.body.email) return next(new Error("missing_email"));
  if (!req.body.password) return next(new Error("missing_password"));

  // Check if the email is already registered
  User.findOne({ where: { email: req.body.email.toLowerCase() } })
    .then((existingUser) => {
      if (existingUser) {
        return next(new Error("email_already_registered"));
      } else {
        // Create a new user
        User.create({
          email: req.body.email.toLowerCase(),
          password: User.generateHash(req.body.password), // Ensure to hash the password before saving it in production
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          mobile: req.body.mobile,
          countryCode: req.body.countryCode,
          authCode: req.body.authCode,
          isRestricted: req.body.isRestricted || false,
        })
          .then((newUser) => {
            // You may want to do additional tasks here like sending a confirmation email
            res.json({
              success: true,
              message: "User registered successfully",
            });
          })
          .catch((err) => {
            return next(err);
          });
      }
    })
    .catch(next);
});

/* Login user. */
router.post("/", function (req, res, next) {
  if (!req.body.email) return next(new Error("missing_email"));
  if (!req.body.password) return next(new Error("missing_password"));
  User.findOne({
    where: {
      email: req.body.email.toLowerCase(),
      // organizationId: val,
    },
  })
    .then((user) => {
      if (!user) {
        return next(new Error("invalid_email"));
      }
      if (!user.isValidPassword(req.body.password)) {
        return next(new Error("invalid_password"));
      }
      if (user.dataValues.isRestricted) {
        res.json({ success: true, data: "restricted" });
      } else {
        jwtUtils.createJwt(user, req.body.rememberMe, function (token) {
          if (token) {
            res.json({
              success: true,
              data: {
                token: token,
              },
            });
            User.update({ lastLogin: new Date() }, { where: { id: user.id } });
          }
        });
      }
    })
    .catch(next);
}); // Assuming you have a User model defined
/*reset forget pasword*/
router.post("/forgot-password", async function (req, res, next) {
  if (!req.body.email) return next(new Error("missing_email"));

  try {
    const user = await User.findOne({
      where: { email: req.body.email.toLowerCase() },
    });

    if (!user) {
      return next(new Error("user_not_found"));
    }

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set the reset token and expiry in the database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send email with the reset link
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

    const mailOptions = {
      to: user.email,
      from: "simranbleem@gmail.com",
      subject: "Password Reset",
      text:
        `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
        `http://localhost:3000/reset-password/${resetToken}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.error("Error sending password reset email:", err);
        return next(err);
      }
      res.json({
        success: true,
        data: info,
        message: "Password reset email sent successfully",
      });
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password/:token", async function (req, res, next) {
  try {
    const token = req.params.token;

    // Find user with the provided token
    const user = await User.findOne({ where: { resetPasswordToken: token } });

    if (!user) {
      return next(new Error("invalid_reset_token"));
    }

    // Check if the token has expired
    if (user.resetPasswordExpires < Date.now()) {
      return next(new Error("reset_token_expired"));
    }

    // Update user's password
    user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8));
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
});

// Password Reset mail

// router.delete("/:email/:orgId/:authPath", async function (req, res, next) {
//   const query = {};
//   let url =
//     req.headers.origin + "/auth/" + req.params.authPath + "/resetpassword/";
//   query.where = { email: req.params.email, organizationId: req.params.orgId };

//   User.findOne(query)
//     .then((users) => {
//       let darktheme = users.dataValues.darkTheme
//       let temName
//       if(darktheme == true){
//         temName = `forgotpassword-darktheme`
//      }else{
//       temName = `forgotpassword`
//      }
//       let token = jwt.sign(
//         {
//           data: users,
//         },
//         config.jwt.secret,
//         { expiresIn: 60 * 60 }
//       );

//       let uuid = uuidv1();

//       PostageApp.findOne({include:[{
//         model:Files
//       }], where: { organizationId: req.params.orgId,forgotPasswordEmailTemplate:temName } ,order: [['updatedAt', 'DESC']] })
//         .then((passwordResetDetails) => {
//           var tempSlug;
//             tempSlug = `${passwordResetDetails.dataValues.forgotPasswordEmailTemplate}`
//           request.post(
//             {
//               headers: { "content-type": "application/json" },
//               url: `${passwordResetDetails.dataValues.apiUrl}`,
//               json: {
//                 api_key: `${passwordResetDetails.dataValues.api_key}`,
//                 uid: `${uuid}`,
//                 arguments: {
//                   recipients: [`${users.dataValues.email}`],
//                   headers: {
//                     // "subject": `${passwordResetDetails.dataValues.project}` + ": Password Reset Request"
//                   },
//                   template: tempSlug,
//                   variables: {
//                     name: `${users.dataValues.firstName}`,
//                     resetlink: `${url}` + `${token}`,
//                     logo:`${passwordResetDetails.dataValues.file.dataValues.downloadLink}`
//                   },
//                 },
//               },
//             },
//             function (error, response) {
//               if (
//                 response.body.response.status !== "unauthorized" &&
//                 response.body.response.status != "bad_request"
//               ) {
//                 if (response.body.data.message.status == "queued") {
//                   res.json({ success: true });
//                 } else {
//                   res.json({ success: false });
//                 }
//               } else {
//                 res.json({ success: false });
//               }
//             }
//           );
//         })
//         .catch(next);
//     })
//     .catch(next);
// });

//reset password

router.patch("/", function (req, res, next) {
  var decoded = jwt.verify(req.body.token, config.jwt.secret);

  let newData = {};
  let query = {};

  if (req.body.password && req.body.password.length)
    newData.password = User.generateHash(req.body.password);

  if (newData.errors) return next(newData.errors[0]);

  query.where = { id: decoded.data.id };
  User.update(newData, query)
    .then(() => {
      res.json({ success: true });
    })
    .catch(next);
});

/* Logout */
router.post("/logout", function (req, res, next) {
  res.json({ success: true, data: "logged out" });
});

module.exports = router;
