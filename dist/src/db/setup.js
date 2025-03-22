"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = void 0;
const init_1 = require("./init");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_js_1 = __importDefault(require("../../config/config.js"));
const env = process.env.NODE_ENV || 'development';
const dbConfig = config_js_1.default[env];
const isSqlite = init_1.sequelize.getDialect() === 'sqlite';
const setupDatabase = async () => {
    try {
        console.log('Starting database setup...');
        console.log('Database URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
        console.log('Node environment:', process.env.NODE_ENV);
        console.log('Database dialect:', init_1.sequelize.getDialect());
        try {
            await init_1.sequelize.authenticate();
            console.log('Database connection authenticated successfully');
        }
        catch (authError) {
            console.error('Failed to authenticate database connection:', authError);
            throw authError;
        }
        try {
            const [existingTables] = await init_1.sequelize.query(isSqlite
                ? "SELECT name FROM sqlite_master WHERE type='table'"
                : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            console.log('Existing tables before setup:', existingTables);
            if (existingTables.length > 3) {
                console.log('Tables already exist, skipping table creation');
                try {
                    await ensureAdminUser();
                    console.log('Admin user check completed successfully');
                }
                catch (adminError) {
                    console.error('Error ensuring admin user exists, but continuing:', adminError);
                }
                console.log('Database setup completed (tables already existed)');
                return;
            }
        }
        catch (checkError) {
            console.error('Error checking existing tables:', checkError);
            try {
                const [teams] = await init_1.sequelize.query("SELECT * FROM teams LIMIT 1");
                if (teams && teams.length > 0) {
                    console.log('Teams table exists and has data, skipping table creation');
                    try {
                        await ensureAdminUser();
                        console.log('Admin user check completed successfully');
                    }
                    catch (adminError) {
                        console.error('Error ensuring admin user exists, but continuing:', adminError);
                    }
                    console.log('Database setup completed (tables already existed)');
                    return;
                }
            }
            catch (simpleCheckError) {
                console.log('Simple table check also failed, will attempt to create tables:', simpleCheckError);
            }
        }
        console.log('Tables do not exist, creating them...');
        try {
            if (isSqlite) {
                console.log('Using SQLite, tables will be dropped during sync');
            }
            else {
                try {
                    await init_1.sequelize.query(`
            DROP TABLE IF EXISTS matches CASCADE;
            DROP TABLE IF EXISTS teams CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
          `);
                    console.log('Existing tables dropped');
                }
                catch (dropError) {
                    console.error('Error dropping tables:', dropError);
                }
            }
            console.log('Creating teams table...');
            if (isSqlite) {
                await init_1.sequelize.query(`
          CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            "teamNumber" INTEGER NOT NULL UNIQUE,
            "autoScoreCoral" BOOLEAN DEFAULT 0,
            "autoScoreAlgae" BOOLEAN DEFAULT 0,
            "mustStartSpecificPosition" BOOLEAN DEFAULT 0,
            "autoStartingPosition" TEXT,
            "teleopDealgifying" BOOLEAN DEFAULT 0,
            "teleopPreference" TEXT,
            "scoringPreference" TEXT,
            "coralLevels" TEXT DEFAULT '[]',
            "endgameType" TEXT DEFAULT 'none',
            "robotWidth" REAL,
            "robotLength" REAL,
            "robotHeight" REAL,
            "robotWeight" REAL,
            "drivetrainType" TEXT,
            "notes" TEXT DEFAULT '',
            "imageUrl" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
            }
            else {
                await init_1.sequelize.query(`
          CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            "teamNumber" INTEGER NOT NULL UNIQUE,
            "autoScoreCoral" BOOLEAN DEFAULT false,
            "autoScoreAlgae" BOOLEAN DEFAULT false,
            "mustStartSpecificPosition" BOOLEAN DEFAULT false,
            "autoStartingPosition" VARCHAR(255),
            "teleopDealgifying" BOOLEAN DEFAULT false,
            "teleopPreference" VARCHAR(255),
            "scoringPreference" VARCHAR(255),
            "coralLevels" TEXT[] DEFAULT '{}',
            "endgameType" VARCHAR(255) DEFAULT 'none',
            "robotWidth" FLOAT,
            "robotLength" FLOAT,
            "robotHeight" FLOAT,
            "robotWeight" FLOAT,
            "drivetrainType" VARCHAR(255),
            "notes" TEXT DEFAULT '',
            "imageUrl" VARCHAR(255),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          )
        `);
            }
            console.log('Teams table created successfully');
            console.log('Creating matches table...');
            if (isSqlite) {
                await init_1.sequelize.query(`
          CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            "matchNumber" INTEGER NOT NULL,
            "teamNumber" INTEGER NOT NULL,
            "autoScoreCoral" BOOLEAN DEFAULT 0,
            "autoScoreAlgae" BOOLEAN DEFAULT 0,
            "autoStartingPosition" TEXT,
            "teleopDealgifying" BOOLEAN DEFAULT 0,
            "teleopPreference" TEXT,
            "scoringPreference" TEXT,
            "coralLevels" TEXT DEFAULT '[]',
            "endgameType" TEXT DEFAULT 'none',
            "notes" TEXT DEFAULT '',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("matchNumber", "teamNumber")
          )
        `);
            }
            else {
                await init_1.sequelize.query(`
          CREATE TABLE IF NOT EXISTS matches (
            id SERIAL PRIMARY KEY,
            "matchNumber" INTEGER NOT NULL,
            "teamNumber" INTEGER NOT NULL,
            "autoScoreCoral" BOOLEAN DEFAULT false,
            "autoScoreAlgae" BOOLEAN DEFAULT false,
            "autoStartingPosition" VARCHAR(255),
            "teleopDealgifying" BOOLEAN DEFAULT false,
            "teleopPreference" VARCHAR(255),
            "scoringPreference" VARCHAR(255),
            "coralLevels" TEXT[] DEFAULT '{}',
            "endgameType" VARCHAR(255) DEFAULT 'none',
            "notes" TEXT DEFAULT '',
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE("matchNumber", "teamNumber")
          )
        `);
            }
            console.log('Matches table created successfully');
            console.log('Creating users table...');
            if (isSqlite) {
                await init_1.sequelize.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            "teamNumber" INTEGER NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
            }
            else {
                await init_1.sequelize.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            "teamNumber" INTEGER NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          )
        `);
            }
            console.log('Users table created successfully');
            const [tables] = await init_1.sequelize.query(isSqlite
                ? "SELECT name FROM sqlite_master WHERE type='table'"
                : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            console.log('Tables after creation:', tables);
        }
        catch (error) {
            console.error('Error creating tables:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
        await ensureAdminUser();
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
async function ensureAdminUser() {
    console.log('Creating admin user...');
    try {
        const hashedPassword = await bcryptjs_1.default.hash('otisit!!!', 10);
        if (isSqlite) {
            await init_1.sequelize.query(`
        INSERT OR REPLACE INTO users (name, email, password, "teamNumber", "createdAt", "updatedAt")
        VALUES ('Admin', '1334admin@gmail.com', '${hashedPassword}', 1334, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
        }
        else {
            try {
                const [existingUsers] = await init_1.sequelize.query(`
          SELECT * FROM users WHERE email = '1334admin@gmail.com'
        `);
                if (existingUsers.length > 0) {
                    console.log('Admin user already exists, updating password');
                    await init_1.sequelize.query(`
            UPDATE users 
            SET password = '${hashedPassword}', "updatedAt" = NOW() 
            WHERE email = '1334admin@gmail.com'
          `);
                }
                else {
                    console.log('Admin user does not exist, creating new user');
                    await init_1.sequelize.query(`
            INSERT INTO users (name, email, password, "teamNumber", "createdAt", "updatedAt")
            VALUES ('Admin', '1334admin@gmail.com', '${hashedPassword}', 1334, NOW(), NOW())
          `);
                }
            }
            catch (pgError) {
                console.error('Error with PostgreSQL admin user operation:', pgError);
                try {
                    await init_1.sequelize.query(`
            INSERT INTO users (name, email, password, "teamNumber", "createdAt", "updatedAt")
            VALUES ('Admin', '1334admin@gmail.com', '${hashedPassword}', 1334, NOW(), NOW())
            ON CONFLICT (email) 
            DO UPDATE SET 
              password = '${hashedPassword}',
              "updatedAt" = NOW()
          `);
                }
                catch (fallbackError) {
                    console.error('Fallback admin user creation also failed:', fallbackError);
                }
            }
        }
        console.log('Admin user created/updated successfully');
        const [users] = await init_1.sequelize.query("SELECT * FROM users WHERE email = '1334admin@gmail.com'");
        console.log(`Found ${users.length} admin users`);
    }
    catch (error) {
        console.error('Error creating admin user:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}
