const Contact = require('../models').Contact;

module.exports = {
    validator: function (next, callback) {
        let err = next.errors.map(prop => {
            let err = {};
            err['message'] = prop.message,
                err['type'] = prop.type,
                err['attribute'] = prop.path,
                err['value'] = prop.value
            return err;
        })
        callback({ success: false, error: err });
    },
}