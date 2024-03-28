const express = require("express");
const router = express.Router();
var passport = require("passport");
const User = require("../../../models").User;
const Role = require("../../../models").Role;
const BusinessListings = require("../../../models").BusinessListings;
const UserMeta = require("../../../models").UserMeta;
const Contact = require("../../../models").Contact;
const ShortAddress = require("../../../models").ShortAddress;
const Logs = require("../../../utils/logs");
const Files = require("../../../models").Files;
const Organization = require("../../../models").Organization;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const utils = require("../../../utils/file");
const ContractorInfo = require("../../../models").ContractorInfo;
const platformbucket = require('../../../config/env-variables-local').platformbucket;

// Reset password

router.put(
  "/resetpassword",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    let newData = {};
    let query = {};
    User.findOne({ where: { id: req.user.id } }).then((curUser) => {
      if (!curUser.isValidPassword(req.body.password.oldPassword)) {
        return res.json({ success: false, data: "Invalid current password." });
      } else {
        if (
          req.body.password.newPassword &&
          req.body.password.newPassword.length
        )
          newData.password = User.generateHash(req.body.password.newPassword);

        if (newData.errors) return next(newData.errors[0]);

        query.where = { id: req.user.id };
        User.update(newData, query)
          .then(() => {
            Logs.LogData(
              "User",
              "resetpassword_updated",
              newData,
              req.user.orgId,
              req.user.id,
              function (data) { }
            );
            res.json({ success: true });
          })
          .catch(next);
      }
    });
  }
);

/* Update Mobile Number */

router.put(
  "/updatemobile",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    let userData = {
      mobile: req.body.mobile,
      status: true,
      countryCode: req.body.countryCode,
      countryISO: req.body.countryISO,
      authyId: req.body.authyId,
    };
    User.update(userData, {
      where: { organizationId: req.user.orgId, id: req.user.id },
    })
      .then((data) => {
        Logs.LogData(
          "User",
          "updated",
          userData,
          req.user.orgId,
          req.user.id,
          function (data) { }
        );
        res.json({ success: true, data: data });
      })
      .catch(next);
  }
);

/* Update Name or Email */

router.put(
  "/",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    let userData = {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };
    User.update(userData, {
      where: { organizationId: req.user.orgId, id: req.user.id },
    })
      .then((data) => {
        Logs.LogData(
          "User",
          "Userdetails_updated",
          userData,
          req.user.orgId,
          req.user.id,
          function (data) { }
        );
        res.json({ success: true, data: data });
      })
      .catch(next);
  }
);

/* Get profile Details */

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    User.findOne({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "mobile",
        "countryCode",
        "countryISO",
        "darkTheme",
        "profileImgFileId",
        "createdAt"
      ],
      include: [
        {
          model: BusinessListings,
          attributes: ["businessListingsId", "companyName"],
        },
        {
          model: UserMeta,
          attributes: ["metaKey", "metaValue"],
          where: {
            metaKey: {
              $or: [{ $eq: "sub_id" }],
            },
          },

          required: false,
        },
        {
          model: Files,
          as: "profileImg",
        },
      ],
      where: { id: req.user.id, organizationId: req.user.orgId },
    })
      .then((user) => {
        res.json({ success: true, data: user });
      })
      .catch(next);
  }
);

/* Get contact Info Details */

router.get(
  "/contact/Info",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    User.findOne({
      attributes: ["id"],
      include: [
        {
          model: Contact,
          as: "formApplication",
          include: [
            {
              model: ShortAddress,
            },
          ],
        },
      ],
      where: { id: req.user.id, organizationId: req.user.orgId },
    })
      .then((user) => {
        res.json({ success: true, data: user });
      })
      .catch(next);
  }
);

/* Get profile Details  for selected User*/

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    User.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Role,
          as: "roles",
        },
        {
          model: Files,
          as: "profileImg",
          attributes: ["fileId", "downloadLink"],
        },
      ],
    })
      .then((user) => {
        res.json({ success: true, data: user });
      })
      .catch(next);
  }
);

/* Update MFA */

router.put(
  "/mfa/user/:userId",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    User.update(
      { isMFA: req.body.mfa },
      { where: { organizationId: req.user.orgId, id: req.params.userId } }
    )
      .then((data) => {
        Logs.LogData(
          "User",
          "updated",
          { isMFA: req.body.mfa },
          req.user.orgId,
          req.user.id,
          function (data) { }
        );
        res.json({ success: true, data: data });
      })
      .catch(next);
  }
);

/* Update LogIn Restriction */

router.put(
  "/loginRestriction/user/:userId",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    User.update(
      { isRestricted: req.body.isRestricted },
      { where: { organizationId: req.user.orgId, id: req.params.userId } }
    )
      .then((data) => {
        Logs.LogData(
          "User",
          "updated",
          { isRestricted: req.body.isRestricted },
          req.user.orgId,
          req.user.id,
          function (data) { }
        );
        res.json({ success: true, data: data });
      })
      .catch(next);
  }
);

/* Update Dark Theme */
router.put(
  "/darkTheme/user/:userId",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    User.update(
      { darkTheme: req.body.darkTheme },
      { where: { organizationId: req.user.orgId, id: req.params.userId } }
    )
      .then((data) => {
        Logs.LogData(
          "User",
          "updated",
          { darkTheme: req.body.darkTheme },
          req.user.orgId,
          req.user.id,
          function (data) { }
        );
        res.json({ success: true, data: data });
      })
      .catch(next);
  }
);
/* Update Role */

router.post(
  "/updateRole",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    User.findOne({ where: { id: req.body.userId } })
      .then((user) => {
        Role.findAll({ where: { id: req.body.roleIds } })
          .then((roles) => {
            Promise.resolve(user.setRoles(roles)).then(() => {
              res.json({ success: true });
            });
          })
          .catch(next);
      })
      .catch(next);
  }
);

// user Image
router.post(
  "/profileImage",
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    Organization.findOne({
      where: { organizationId: req.user.orgId },
    })
      .then((organizationDetails) => {
        utils.uploadFile(
          req.files[0],
          organizationDetails.name,
          process.env.platformbucket? process.env.platformbucket: platformbucket,
          "public-read",
          0,
          organizationDetails.organizationId,
          req.user.id,
          function (fileId) {
            if (fileId) {
              User.update(
                {
                  profileImgFileId: fileId,
                },
                { where: { id: req.body.userId } }
              ).then(() => {
                // if (req.body.fileId != null) {
                //   utils.deleteFile(
                //     req.body.fileId,
                //     req.user.orgId,
                //     req.user.id,
                //     function (data) {
                //       res.json({ success: true, data: data });
                //     }
                //   );
                // } else {
                res.json({ success: true, data: fileId });
                // }
              });
            }
          }
        );
      })
      .catch(next => console.log(next));
  }
);


router.post(
  "/contractor/profileImage",
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    Organization.findOne({
      where: { organizationId: req.user.orgId },
    })
      .then((organizationDetails) => {
        utils.uploadFile(
          req.files[0],
          organizationDetails.name,
          process.env.platformbucket? process.env.platformbucket: platformbucket,
          "public-read",
          0,
          organizationDetails.organizationId,
          req.user.id,
          function (fileId) {
            if (fileId) {
              ContractorInfo.update(
                {
                  fileId: fileId,
                },
                { where: { userId: req.body.userId } }
              ).then(() => {
                res.json({ success: true, data: fileId });
              });
            }
          }
        );
      })
      .catch(next => console.log(next));
  }
);

module.exports = router;
