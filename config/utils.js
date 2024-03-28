const utils = this;

//Validate request object and set property

exports.validateQuery = function(request, validated, prop){
    let value;

    if(typeof request[prop] === 'undefined')
        return;

    if(prop === 'birthday')
        value = utils.returnValidatedDate(request[prop]);
    else if(prop === 'username')
        value = utils.returnValidatedUsername(request[prop]);
    else if(prop === 'email')
        value = utils.returnValidatedEmail(request[prop]);
    else
        value = request[prop];

    if(value instanceof Error) {
        validated.errors = validated.errors || [];

        if(value.message)
            validated.errors.push(value);
        else
            validated.errors.push(new Error('invalid_' + prop));
    }
    else
        validated[prop] = value;
};

//Return validated date

exports.returnValidatedDate = function(date){
    let d = new Date(date);

    if(d.getTime())
        return d;
    else if(+date)
        return new Date(+date);
    else
        return new Error()
};

//Return validated username

exports.returnValidatedUsername = function(username){

    if(username.length > 99)
        return new Error('incorrect_username_length');

    return username.replace(/\s/g,'').toLowerCase();
};

//Return validated email

exports.returnValidatedEmail = function(email){
    let pattern = /^([a-zA-Z0-9+\_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,15})$/;

    if(email.length > 99)
        return new Error('incorrect_email_length');
    if(!email.match(pattern))
        return new Error('invalid_email');

    return email.toLowerCase();
};