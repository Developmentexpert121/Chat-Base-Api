'use strict';

const bcrypt = require('bcrypt');


module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define('User', {
        email: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        mobile: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        countryCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        authCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isRestricted: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        lastLogin: {
            type: DataTypes.DATE,
        },
        createdBy: {
            type: DataTypes.INTEGER,
        },
        updatedBy: {
            type: DataTypes.INTEGER,
        },
        resetPasswordToken:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        resetPasswordExpires:{
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
        tableName: 'user',
        paranoid: true,
        timestamps: true,
        freezeTableName: true
    });

    User.generateHash = function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    User.prototype.isValidPassword = function (password) {
        return bcrypt.compareSync(password, this.password)
    };

    User.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());

        delete values.password;
        delete values.createdBy;

        return values;
    };

    return User;
};