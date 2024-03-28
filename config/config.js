"use strict";

const env = process.env.NODE_ENV = process.env.NODE_ENV || 'local';

let config = {};

config.production = {
    db: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: "mysql",
        migrationStorage: "json",
        define: {
            charset: 'utf8',
            collate: 'utf8_general_ci',
            timestamps: true
        }
    },
    jwt: {
        secret: process.env.SECRET_KEY,
        algorithm: 'HS512'
    }
};

config.local = {
    db: {
        username: "root",
        password: "",
        database: "BkYoBTkLCx",
        host: "127.0.0.1",
        port: 3306,
        dialect: "mysql",
        migrationStorage: "json",
        define: {
            charset: 'utf8',
            collate: 'utf8_general_ci',
            timestamps: true
        }
    },
    jwt: {
        secret: '5b3610545c5ba45!af07e1{a69870`2a5e582b471e%8c270945#~d414024888',
        algorithm: 'HS512'
    }
};

module.exports = config[env];
