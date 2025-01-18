"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const env = process.env.NODE_ENV || 'development';
const databaseUrl = process.env.DATABASE_URL;
let sequelize;
if (env === 'production' && databaseUrl) {
    sequelize = new sequelize_1.Sequelize(databaseUrl, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
}
else {
    sequelize = new sequelize_1.Sequelize({
        database: process.env.DB_NAME || 'scouting_app',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres'
    });
}
exports.default = sequelize;
//# sourceMappingURL=database.js.map