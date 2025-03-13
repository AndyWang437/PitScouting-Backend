import { sequelize } from './init';
import bcrypt from 'bcryptjs';

export const setupDatabase = async () => {
  try {
    console.log('Starting database setup...');
    console.log('Database URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
    console.log('Node environment:', process.env.NODE_ENV);
    
    // First, try to authenticate to make sure we can connect to the database
    try {
      await sequelize.authenticate();
      console.log('Database connection authenticated successfully');
    } catch (authError) {
      console.error('Failed to authenticate database connection:', authError);
      throw authError;
    }
    
    // Drop and recreate tables
    console.log('Dropping and recreating tables...');
    try {
      // Drop tables if they exist
      await sequelize.query(`
        DROP TABLE IF EXISTS matches CASCADE;
        DROP TABLE IF EXISTS teams CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
      console.log('Existing tables dropped');
      
      // Create teams table
      console.log('Creating teams table...');
      await sequelize.query(`
        CREATE TABLE teams (
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
      
      // Create matches table
      console.log('Creating matches table...');
      await sequelize.query(`
        CREATE TABLE matches (
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
      
      // Create users table
      console.log('Creating users table...');
      await sequelize.query(`
        CREATE TABLE users (
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
      
      // List tables to confirm creation
      const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      console.log('Tables after creation:', tables);
      
    } catch (error) {
      console.error('Error creating tables:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
    
    // Create admin user
    console.log('Creating admin user...');
    try {
      const hashedPassword = await bcrypt.hash('otisit!!!', 10);
      
      await sequelize.query(`
        INSERT INTO users (name, email, password, "teamNumber", "createdAt", "updatedAt")
        VALUES ('Admin', '1334admin@gmail.com', '${hashedPassword}', 1334, NOW(), NOW())
        ON CONFLICT (email) 
        DO UPDATE SET 
          password = '${hashedPassword}',
          "updatedAt" = NOW()
      `);
      
      console.log('Admin user created/updated successfully');
      
      // Verify user was created
      const [users] = await sequelize.query("SELECT * FROM users WHERE email = '1334admin@gmail.com'");
      console.log(`Found ${users.length} admin users`);
      
    } catch (error) {
      console.error('Error creating admin user:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Don't throw here, as we want the app to start even if user creation fails
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}; 