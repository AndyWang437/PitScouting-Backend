"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const config_js_1 = __importDefault(require("../../config/config.js"));
const env = process.env.NODE_ENV || 'development';
const dbConfig = config_js_1.default[env];
let sequelize;
if (env === 'production') {
    exports.sequelize = sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: false
    });
}
else {
    exports.sequelize = sequelize = new sequelize_1.Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: 'postgres',
        logging: false
    });
}
const initDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        console.log('Environment:', env);
        // Only force sync in development
        if (env === 'development') {
            await sequelize.sync({ force: true });
            console.log('Database synced in development mode');
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initDb = initDb;
