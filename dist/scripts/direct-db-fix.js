const { Client } = require('pg');
require('dotenv').config();

async function fixDatabaseDirectly() {
  console.log('Starting direct database fix script...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set!');
    return false;
  }
  
  let client;
  
  try {
    // Connect directly to PostgreSQL with SSL
    console.log('Connecting directly to PostgreSQL with SSL...');
    try {
      client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      await client.connect();
      console.log('Connected to PostgreSQL successfully with SSL');
    } catch (sslError) {
      console.error('Error connecting with SSL:', sslError);
      
      // Try without SSL
      console.log('Trying to connect without SSL...');
      client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
      });
      
      try {
        await client.connect();
        console.log('Connected to PostgreSQL successfully without SSL');
      } catch (noSslError) {
        console.error('Error connecting without SSL:', noSslError);
        
        // Try with a different SSL configuration
        console.log('Trying with a different SSL configuration...');
        client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: true
        });
        
        await client.connect();
        console.log('Connected to PostgreSQL successfully with SSL=true');
      }
    }
    
    // Check if tables exist
    console.log('Checking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables);
    
    // Drop tables if they exist
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS matches CASCADE;
      DROP TABLE IF EXISTS teams CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Tables dropped successfully');
    
    // Create teams table
    console.log('Creating teams table...');
    try {
      await client.query(`
        CREATE TABLE teams (
          id SERIAL PRIMARY KEY,
          "teamNumber" INTEGER NOT NULL UNIQUE,
          "autoScoreCoral" BOOLEAN DEFAULT false,
          "autoScoreAlgae" BOOLEAN DEFAULT false,
          "mustStartSpecificPosition" BOOLEAN DEFAULT false,
          "autoStartingPosition" TEXT,
          "teleopDealgifying" BOOLEAN DEFAULT false,
          "teleopPreference" TEXT,
          "scoringPreference" TEXT,
          "coralLevels" TEXT DEFAULT '[]',
          "endgameType" TEXT DEFAULT 'none',
          "robotWidth" FLOAT,
          "robotLength" FLOAT,
          "robotHeight" FLOAT,
          "robotWeight" FLOAT,
          "drivetrainType" TEXT,
          "notes" TEXT DEFAULT '',
          "imageUrl" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Teams table created successfully');
    } catch (teamsError) {
      console.error('Error creating teams table:', teamsError);
      
      // Try a simpler approach
      console.log('Trying a simpler approach for teams table...');
      await client.query(`
        CREATE TABLE teams (
          id SERIAL PRIMARY KEY,
          "teamNumber" INTEGER NOT NULL,
          "autoScoreCoral" BOOLEAN,
          "autoScoreAlgae" BOOLEAN,
          "mustStartSpecificPosition" BOOLEAN,
          "autoStartingPosition" TEXT,
          "teleopDealgifying" BOOLEAN,
          "teleopPreference" TEXT,
          "scoringPreference" TEXT,
          "coralLevels" TEXT,
          "endgameType" TEXT,
          "robotWidth" FLOAT,
          "robotLength" FLOAT,
          "robotHeight" FLOAT,
          "robotWeight" FLOAT,
          "drivetrainType" TEXT,
          "notes" TEXT,
          "imageUrl" TEXT,
          "createdAt" TIMESTAMP,
          "updatedAt" TIMESTAMP
        )
      `);
      console.log('Teams table created with simpler approach');
    }
    
    // Create matches table
    console.log('Creating matches table...');
    try {
      await client.query(`
        CREATE TABLE matches (
          id SERIAL PRIMARY KEY,
          "matchNumber" INTEGER NOT NULL,
          "teamNumber" INTEGER NOT NULL,
          "autoScoreCoral" BOOLEAN DEFAULT false,
          "autoScoreAlgae" BOOLEAN DEFAULT false,
          "autoStartingPosition" TEXT,
          "teleopDealgifying" BOOLEAN DEFAULT false,
          "teleopPreference" TEXT,
          "scoringPreference" TEXT,
          "coralLevels" TEXT DEFAULT '[]',
          "endgameType" TEXT DEFAULT 'none',
          "notes" TEXT DEFAULT '',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          UNIQUE("matchNumber", "teamNumber")
        )
      `);
      console.log('Matches table created successfully');
    } catch (matchesError) {
      console.error('Error creating matches table:', matchesError);
      
      // Try a simpler approach
      console.log('Trying a simpler approach for matches table...');
      await client.query(`
        CREATE TABLE matches (
          id SERIAL PRIMARY KEY,
          "matchNumber" INTEGER NOT NULL,
          "teamNumber" INTEGER NOT NULL,
          "autoScoreCoral" BOOLEAN,
          "autoScoreAlgae" BOOLEAN,
          "autoStartingPosition" TEXT,
          "teleopDealgifying" BOOLEAN,
          "teleopPreference" TEXT,
          "scoringPreference" TEXT,
          "coralLevels" TEXT,
          "endgameType" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP,
          "updatedAt" TIMESTAMP
        )
      `);
      console.log('Matches table created with simpler approach');
    }
    
    // Create users table
    console.log('Creating users table...');
    try {
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          "teamNumber" INTEGER NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Users table created successfully');
    } catch (usersError) {
      console.error('Error creating users table:', usersError);
      
      // Try a simpler approach
      console.log('Trying a simpler approach for users table...');
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          "teamNumber" INTEGER NOT NULL,
          "createdAt" TIMESTAMP,
          "updatedAt" TIMESTAMP
        )
      `);
      console.log('Users table created with simpler approach');
    }
    
    // Verify tables were created
    const tablesAfterResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tablesAfter = tablesAfterResult.rows.map(row => row.table_name);
    console.log('Tables after creation:', tablesAfter);
    
    // Create admin user
    console.log('Creating admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('otisit!!!', 10);
    
    // Check if admin user exists
    const adminResult = await client.query(`
      SELECT * FROM users WHERE email = '1334admin@gmail.com'
    `);
    
    if (adminResult.rows.length === 0) {
      await client.query(`
        INSERT INTO users (name, email, password, "teamNumber", "createdAt", "updatedAt")
        VALUES ('Admin', '1334admin@gmail.com', $1, 1334, NOW(), NOW())
      `, [hashedPassword]);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Verify table structure
    console.log('Verifying table structure...');
    
    // Check teams table columns
    const teamsColumnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND table_schema = 'public'
    `);
    console.log('Teams table columns:', teamsColumnsResult.rows);
    
    // Check matches table columns
    const matchesColumnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND table_schema = 'public'
    `);
    console.log('Matches table columns:', matchesColumnsResult.rows);
    
    // Check users table columns
    const usersColumnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    console.log('Users table columns:', usersColumnsResult.rows);
    
    // Close the connection
    await client.end();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Error fixing database directly:', error);
    
    if (client) {
      try {
        await client.end();
        console.log('Database connection closed after error');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
    
    return false;
  }
}

// Run the fix
fixDatabaseDirectly()
  .then(success => {
    console.log('Direct database fix completed with status:', success ? 'SUCCESS' : 'FAILURE');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error during direct database fix:', error);
    process.exit(1);
  }); 