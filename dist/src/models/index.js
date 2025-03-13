"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = exports.User = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const init_1 = require("../db/init");
const config_1 = __importDefault(require("../../config/config"));
const user_1 = require("./user");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_1.User; } });
const team_1 = __importDefault(require("./team"));
exports.Team = team_1.default;
const env = process.env.NODE_ENV || 'development';
const dbConfig = config_1.default[env];
console.log('Initializing models...');
console.log('Environment:', env);
let sequelize;
if ('use_env_variable' in dbConfig && dbConfig.use_env_variable) {
    console.log(`Using environment variable ${dbConfig.use_env_variable} for database connection`);
    const dbUrl = process.env[dbConfig.use_env_variable];
    if (!dbUrl) {
        console.error(`Environment variable ${dbConfig.use_env_variable} is not set`);
        throw new Error(`Environment variable ${dbConfig.use_env_variable} is not set`);
    }
    console.log(`Database URL from environment variable exists: ${!!dbUrl}`);
    exports.sequelize = sequelize = new sequelize_1.Sequelize(dbUrl, {
        ...dbConfig,
        dialect: 'postgres',
    });
    console.log('Sequelize instance created from environment variable');
}
else {
    console.log('Using sequelize instance from db/init');
    exports.sequelize = sequelize = init_1.sequelize;
}
try {
    console.log('Initializing User model...');
    user_1.User.initialize(sequelize);
    console.log('User model initialized successfully');
    console.log('Initializing Team model...');
    team_1.default.initialize(sequelize);
    console.log('Team model initialized successfully');
    console.log('All models initialized successfully');
}
catch (error) {
    console.error('Error initializing models:', error);
    if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
    throw error;
}
