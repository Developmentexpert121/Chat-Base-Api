const express = require('express');
const router = express.Router();
const Cron_Manager = require('../../../models').Cron_Manager;

router.get('/:value', function (req, res, next) {
    Cron_Manager.findOne({
        where: { organizationId: req.user.orgId,component:req.params.value }, order: [['updatedAt', 'ASC']],
    }).then((userList) => {
        res.json({ success: true, data: userList });
    });
});

router.post('/', function (req, res, next) {
    Cron_Manager.findOne({
        where: { organizationId: req.user.orgId,component:req.body.component }, order: [['updatedAt', 'ASC']],
    }).then((userList) => {
        if(userList){
            Cron_Manager.update({
                values: req.body.values
            }, {
                where: {  organizationId: req.user.orgId, Id: userList.dataValues.Id }
            }).then((data) => {
                res.json({ success: true, data: data });
            }).catch(next)
        }else{
            Cron_Manager.create({
                component: req.body.component, values: req.body.values,
                organizationId: req.user.orgId,userId: req.user.id
            }).then((data) => {
                res.json({ success: true, data: data });
            }).catch(next)
        }
    }).catch(next)
    
});


module.exports = router;