const express = require('express');
const router = express.Router();
const User = require('../../../models').User;
const Role = require('../../../models').Role;
const Logs = require("../../../utils/logs");


router.post('/', function (req, res, next) {
    User.create({
        email: req.body.email, password: User.generateHash(req.body.password),
        firstName: req.body.firstName, lastName: req.body.lastName,
        createdBy: req.user.id, organizationId: req.user.orgId,
        isRestricted: req.body.isRestricted
    }).then((createdUser) => {
        Logs.LogData("User","created",createdUser, req.user.orgId,req.user.id,function (data) {});
        Role.findAll({ where: { id: req.body.roleId } }).then((roles) => {
            Promise.resolve(createdUser.setRoles(roles)).then((userRole) => {
                Logs.LogData("User_role","created",userRole, req.user.orgId,req.user.id,function (data) {});
                res.json({ success: true, data: createdUser });
            })
        }).catch(next);
    }).catch(next);
});


router.get('/', function (req, res, next) {
    User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
        include: [
            {
                model: Role, as: 'roles'
            }
        ],
        where: { organizationId: req.user.orgId }, order: [['updatedAt', 'DESC']],
    }).then((userList) => {
        res.json({ success: true, data: userList });
    }).catch(next)
});


router.delete('/:id', function (req, res, next) {
    User.destroy({
        where: { id: req.params.id },
    }).then(() => {
        Logs.LogData("User","deleted",{ id: req.params.id }, req.user.orgId,req.user.id,function (data) {});
        res.json({ success: true });
    }).catch(next)
});

/* Update Name or Email */

router.post('/updateEmailName', function (req, res, next) {
    let userData = { email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName }
    User.update(userData,
        { where: { organizationId: req.user.orgId, id: req.body.userId } }).then((data) => {
            Logs.LogData("User","updated", userData, req.user.orgId,req.user.id,function (data) {});
            res.json({ success: true, data: data })
        }).catch(next)
})

router.post('/updateMobile', function (req, res, next) {
    User.update({ mobile: req.body.mobile,countryCode: req.body.countryCode},
        { where: { organizationId: req.user.orgId, id: req.body.userId } }).then((data) => {
            Logs.LogData("User","updated", { mobile: req.body.mobile,countryCode: req.body.countryCode}, 
            req.user.orgId,req.user.id,function (data) {});
            res.json({ success: true, data: data })
        }).catch(next)
})

module.exports = router;