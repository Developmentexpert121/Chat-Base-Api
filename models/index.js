"use strict";

const Sequelize = require("sequelize");
let config = require(__dirname + "/../config/db-config");

let db = {};
let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/* MODELS */

db.User = require("./core/user")(sequelize, Sequelize);

// cron mananger
db.Cron_Manager = require("./standard/cron-manager/cron-manager")(
  sequelize,
  Sequelize
);

db.User.hasMany(db.Cron_Manager, { foreignKey: "userId", sourceKey: "id" });


module.exports = db;
