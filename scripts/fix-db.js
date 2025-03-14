const { Sequelize } = require('sequelize');
require('dotenv').config();

async function fixDatabase() {
  console.log('Starting database fix script...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
  
  let sequelize;
  
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('Using production database configuration');
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: console.log
      });
    } else {
      console.log('Using development database configuration');
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: console.log
      });
    }
    
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully');
    
    // Check if tables exist
    const dialect = sequelize.getDialect();
    console.log('Database dialect:', dialect);
    
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Existing tables:', tables);
    
    // Check if teams table exists
    const teamsExists = tables.some(t => 
      (dialect === 'sqlite' && t.name === 'teams') || 
      (dialect === 'postgres' && t.table_name === 'teams')
    );
    
    if (!teamsExists) {
      console.log('Teams table does not exist, creating it...');
      
      if (dialect === 'postgres') {
        await sequelize.query(`
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
        console.log('Teams table created successfully');
      } else {
        await sequelize.query(`
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
        console.log('Teams table created successfully');
      }
    }
    
    // Check if matches table exists
    const matchesExists = tables.some(t => 
      (dialect === 'sqlite' && t.name === 'matches') || 
      (dialect === 'postgres' && t.table_name === 'matches')
    );
    
    if (!matchesExists) {
      console.log('Matches table does not exist, creating it...');
      
      if (dialect === 'postgres') {
        await sequelize.query(`
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
        console.log('Matches table created successfully');
      } else {
        await sequelize.query(`
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
        console.log('Matches table created successfully');
      }
    }
    
    // Check if users table exists
    const usersExists = tables.some(t => 
      (dialect === 'sqlite' && t.name === 'users') || 
      (dialect === 'postgres' && t.table_name === 'users')
    );
    
    if (!usersExists) {
      console.log('Users table does not exist, creating it...');
      
      if (dialect === 'postgres') {
        await sequelize.query(`
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
        console.log('Users table created successfully');
      } else {
        await sequelize.query(`
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
        console.log('Users table created successfully');
      }
    }
    
    // Create admin user if it doesn't exist
    console.log('Checking for admin user...');
    const [adminUsers] = await sequelize.query("SELECT * FROM users WHERE email = '1334admin@gmail.com'");
    
    if (adminUsers.length === 0) {
      console.log('Admin user does not exist, creating it...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('otisit!!!', 10);
      
      if (dialect === 'postgres') {
        await sequelize.query(`
          INSERT INTO users (name, email, password, "teamNumber", "createdAt", "updatedAt")
          VALUES ('Admin', '1334admin@gmail.com', '${hashedPassword}', 1334, NOW(), NOW())
        `);
      } else {
        await sequelize.query(`
          INSERT INTO users (name, email, password, "teamNumber", "createdAt", "updatedAt")
          VALUES ('Admin', '1334admin@gmail.com', '${hashedPassword}', 1334, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
      }
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check tables again to confirm creation
    const [tablesAfter] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Tables after fix:', tablesAfter);
    
    // Close the connection
    await sequelize.close();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Error fixing database:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    if (sequelize) {
      try {
        await sequelize.close();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
    
    return false;
  }
}

// Run the fix
fixDatabase()
  .then(success => {
    console.log('Database fix completed with status:', success ? 'SUCCESS' : 'FAILURE');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error during database fix:', error);
    process.exit(1);
  }); 