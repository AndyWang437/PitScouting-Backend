"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const config_1 = __importDefault(require("../../config/config"));
const env = process.env.NODE_ENV || 'development';
const dbConfig = config_1.default[env];
exports.sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: env === 'production' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    logging: false
});
const initDb = async () => {
    try {
        await exports.sequelize.authenticate();
        console.log('Database connection established successfully.');
        // Force sync in development only
        if (env === 'development') {
            await exports.sequelize.sync({ force: true });
            console.log('Database synced in development mode');
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initDb = initDb;
