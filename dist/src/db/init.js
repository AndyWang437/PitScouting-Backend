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
console.log('Initializing database connection...');
console.log('Environment:', env);
console.log('Database URL exists:', !!process.env.DATABASE_URL);
if (env === 'production') {
    console.log('Using production database configuration');
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL environment variable is not set!');
        throw new Error('DATABASE_URL environment variable is required in production');
    }
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
        logging: console.log
    });
    console.log('Production database connection initialized');
}
else {
    console.log('Using development database configuration');
    console.log('Database config:', {
        database: dbConfig.database,
        username: dbConfig.username,
        host: dbConfig.host
    });
    exports.sequelize = sequelize = new sequelize_1.Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: 'postgres',
        logging: console.log
    });
    console.log('Development database connection initialized');
}
const initDb = async () => {
    try {
        console.log('Authenticating database connection...');
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        console.log('Environment:', env);
        // Only force sync in development
        if (env === 'development') {
            console.log('Syncing database in development mode...');
            await sequelize.sync({ force: true });
            console.log('Database synced in development mode');
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
};
exports.initDb = initDb;
