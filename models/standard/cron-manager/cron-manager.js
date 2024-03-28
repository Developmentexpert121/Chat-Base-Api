'use strict';

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    let Cron_Manager = sequelize.define('cron_manager', {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        values: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
            tableName: 'cron_manager',
            freezeTableName: true
        }
    );

    return Cron_Manager;
};