"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env = process.env.NODE_ENV || 'development';
console.log('Environment:', env);
let sequelize;
console.log('Database config:', {
    dialect: env === 'production' ? 'postgres' : 'sqlite',
    storage: env === 'production' ? undefined : './database.sqlite',
    password: process.env.DATABASE_URL ? '********' : undefined
});
const initDb = async () => {
    try {
        console.log('Initializing database...');
        if (env === 'production') {
            console.log('Using PostgreSQL for production');
            try {
                exports.sequelize = sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
                    dialect: 'postgres',
                    dialectOptions: {
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                        }
                    },
                    logging: console.log
                });
                await sequelize.authenticate();
                console.log('Database connection established successfully with SSL.');
            }
            catch (sslError) {
                console.error('Error connecting with SSL:', sslError);
                try {
                    console.log('Trying to connect without SSL...');
                    exports.sequelize = sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
                        dialect: 'postgres',
                        logging: console.log
                    });
                    await sequelize.authenticate();
                    console.log('Database connection established successfully without SSL.');
                }
                catch (noSslError) {
                    console.error('Error connecting without SSL:', noSslError);
                    throw noSslError;
                }
            }
        }
        else {
            console.log('Using SQLite for development');
            const dbDir = path_1.default.dirname('./database.sqlite');
            if (!fs_1.default.existsSync(dbDir)) {
                fs_1.default.mkdirSync(dbDir, { recursive: true });
            }
            exports.sequelize = sequelize = new sequelize_1.Sequelize({
                dialect: 'sqlite',
                storage: './database.sqlite',
                logging: console.log
            });
            await sequelize.authenticate();
            console.log('Database connection established successfully.');
            await sequelize.sync();
            console.log('Database synced in development mode');
        }
        try {
            const [tables] = await sequelize.query(sequelize.getDialect() === 'sqlite'
                ? "SELECT name FROM sqlite_master WHERE type='table'"
                : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            console.log('Existing tables:', tables);
        }
        catch (error) {
            console.error('Error checking existing tables:', error);
        }
        console.log('Database initialized successfully');
        return sequelize;
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initDb = initDb;
