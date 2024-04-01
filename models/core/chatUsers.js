'use strict';

const bcrypt = require('bcrypt');


module.exports = (sequelize, DataTypes) => {
    let chatUsers = sequelize.define('chatUsers', {
        eventType: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        chatbotId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        conversationId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        customerEmail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        customerName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        customerPhone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.INTEGER,
        },
        updatedBy: {
            type: DataTypes.INTEGER,
        },
    }, {
        tableName: 'chatUsers',
        paranoid: true,
        timestamps: true,
        freezeTableName: true
    });

    return chatUsers;
};