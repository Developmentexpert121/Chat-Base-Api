const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = {

    createJwt: function (user, rememberMe, callback) {
        let expiresIn = rememberMe ? '15d' : '1d';
 
        let token = jwt.sign({
            id: user.id,
            email: user.email.toLowerCase(),
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            countryCode: user.countryCode,
            isRestricted: user.isRestricted,
        }, config.jwt.secret, { expiresIn: expiresIn, algorithm: config.jwt.algorithm });
        callback(token);
    }
}
