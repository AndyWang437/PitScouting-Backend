"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = void 0;
const init_1 = require("./init");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const setupDatabase = async () => {
    try {
        console.log('Starting database setup...');
        console.log('Database URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
        console.log('Node environment:', process.env.NODE_ENV);
        // Run migrations programmatically
        console.log('Running migrations...');
        try {
            // This will sync all models with the database
            // In production, we're not using force: true to avoid data loss
            console.log('Syncing models with database...');
            await init_1.sequelize.sync();
            console.log('Database synced successfully');
            // List all tables in the database
            try {
                const [results] = await init_1.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
                console.log('Tables in database:', results);
            }
            catch (error) {
                console.error('Error listing tables:', error);
            }
        }
        catch (error) {
            console.error('Error syncing database:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
        // Create admin user if it doesn't exist
        console.log('Checking for admin user...');
        try {
            const existingUser = await models_1.User.findOne({
                where: {
                    email: '1334admin@gmail.com'
                }
            });
            if (!existingUser) {
                console.log('Admin user not found, creating...');
                const hashedPassword = await bcryptjs_1.default.hash('otisit!!!', 10);
                const user = await models_1.User.create({
                    name: 'Admin',
                    email: '1334admin@gmail.com',
                    password: hashedPassword,
                    teamNumber: 1334
                });
                console.log('Admin user created successfully:', user.id);
            }
            else {
                console.log('Admin user already exists:', existingUser.id);
            }
        }
        catch (error) {
            console.error('Error creating admin user:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            // Don't throw here, as we want the app to start even if user creation fails
        }
        console.log('Database setup completed successfully');
    }
    catch (error) {
        console.error('Database setup failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
};
exports.setupDatabase = setupDatabase;
