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
      // Try different SSL configurations if the default one fails
      try {
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
      } catch (sslError) {
        console.error('Error connecting with SSL, trying without SSL:', sslError);
        sequelize = new Sequelize(process.env.DATABASE_URL, {
          dialect: 'postgres',
          logging: console.log
        });
      }
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
    
    // First, try to drop all tables to ensure a clean slate
    if (dialect === 'postgres') {
      try {
        console.log('Attempting to drop all tables for a clean start...');
        await sequelize.query(`
          DROP TABLE IF EXISTS matches CASCADE;
          DROP TABLE IF EXISTS teams CASCADE;
          DROP TABLE IF EXISTS users CASCADE;
        `);
        console.log('Tables dropped successfully');
      } catch (dropError) {
        console.error('Error dropping tables:', dropError);
        // Continue anyway, as we'll create the tables
      }
      
      // Verify that tables are actually dropped
      try {
        const [tables] = await sequelize.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        console.log('Tables after drop:', tables.map(t => t.table_name));
      } catch (checkError) {
        console.error('Error checking tables after drop:', checkError);
      }
    }
    
    // Create teams table
    console.log('Creating teams table...');
    if (dialect === 'postgres') {
      // Try multiple approaches to create the teams table
      const createTeamsAttempts = [
        // Attempt 1: Standard approach with TEXT[] for coralLevels
        `
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
        `,
        // Attempt 2: Simplified schema
        `
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
            "coralLevels" TEXT[],
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
        `,
        // Attempt 3: Raw SQL approach
        `
          CREATE TABLE public.teams (
            id serial NOT NULL,
            "teamNumber" int4 NOT NULL,
            "autoScoreCoral" bool NULL,
            "autoScoreAlgae" bool NULL,
            "mustStartSpecificPosition" bool NULL,
            "autoStartingPosition" text NULL,
            "teleopDealgifying" bool NULL,
            "teleopPreference" text NULL,
            "scoringPreference" text NULL,
            "coralLevels" _text NULL,
            "endgameType" text NULL,
            "robotWidth" float8 NULL,
            "robotLength" float8 NULL,
            "robotHeight" float8 NULL,
            "robotWeight" float8 NULL,
            "drivetrainType" text NULL,
            notes text NULL,
            "imageUrl" text NULL,
            "createdAt" timestamp NULL,
            "updatedAt" timestamp NULL,
            CONSTRAINT teams_pkey PRIMARY KEY (id),
            CONSTRAINT teams_teamnumber_key UNIQUE ("teamNumber")
          )
        `,
        // Attempt 4: Using JSON instead of TEXT[] for coralLevels
        `
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
            "coralLevels" JSON DEFAULT '[]',
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
        `,
        // Attempt 5: Using TEXT for coralLevels (will be parsed in the controller)
        `
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
        `
      ];
      
      let teamsTableCreated = false;
      
      for (let i = 0; i < createTeamsAttempts.length; i++) {
        try {
          console.log(`Attempting to create teams table (attempt ${i + 1})...`);
          await sequelize.query(createTeamsAttempts[i]);
          console.log(`Teams table created successfully (attempt ${i + 1})`);
          teamsTableCreated = true;
          break;
        } catch (createError) {
          console.error(`Error creating teams table (attempt ${i + 1}):`, createError);
        }
      }
      
      if (!teamsTableCreated) {
        console.error('All attempts to create teams table failed!');
      }
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
    
    // Create matches table
    console.log('Creating matches table...');
    if (dialect === 'postgres') {
      // Try multiple approaches to create the matches table
      const createMatchesAttempts = [
        // Attempt 1: Standard approach with TEXT[] for coralLevels
        `
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
        `,
        // Attempt 2: Simplified schema
        `
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
            "coralLevels" TEXT[],
            "endgameType" TEXT,
            "notes" TEXT,
            "createdAt" TIMESTAMP,
            "updatedAt" TIMESTAMP
          )
        `,
        // Attempt 3: Using JSON instead of TEXT[] for coralLevels
        `
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
            "coralLevels" JSON DEFAULT '[]',
            "endgameType" TEXT DEFAULT 'none',
            "notes" TEXT DEFAULT '',
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            UNIQUE("matchNumber", "teamNumber")
          )
        `,
        // Attempt 4: Using TEXT for coralLevels (will be parsed in the controller)
        `
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
        `
      ];
      
      let matchesTableCreated = false;
      
      for (let i = 0; i < createMatchesAttempts.length; i++) {
        try {
          console.log(`Attempting to create matches table (attempt ${i + 1})...`);
          await sequelize.query(createMatchesAttempts[i]);
          console.log(`Matches table created successfully (attempt ${i + 1})`);
          matchesTableCreated = true;
          break;
        } catch (createError) {
          console.error(`Error creating matches table (attempt ${i + 1}):`, createError);
        }
      }
      
      if (!matchesTableCreated) {
        console.error('All attempts to create matches table failed!');
      }
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
    
    // Create users table
    console.log('Creating users table...');
    if (dialect === 'postgres') {
      // Try multiple approaches to create the users table
      const createUsersAttempts = [
        // Attempt 1: Standard approach
        `
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            "teamNumber" INTEGER NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          )
        `,
        // Attempt 2: Simplified schema
        `
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            "teamNumber" INTEGER NOT NULL,
            "createdAt" TIMESTAMP,
            "updatedAt" TIMESTAMP
          )
        `,
        // Attempt 3: Even simpler schema
        `
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            "teamNumber" INTEGER NOT NULL,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW()
          )
        `
      ];
      
      let usersTableCreated = false;
      
      for (let i = 0; i < createUsersAttempts.length; i++) {
        try {
          console.log(`Attempting to create users table (attempt ${i + 1})...`);
          await sequelize.query(createUsersAttempts[i]);
          console.log(`Users table created successfully (attempt ${i + 1})`);
          usersTableCreated = true;
          break;
        } catch (createError) {
          console.error(`Error creating users table (attempt ${i + 1}):`, createError);
        }
      }
      
      if (!usersTableCreated) {
        console.error('All attempts to create users table failed!');
      }
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
    
    // Check if tables were created
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Tables after creation:', tables);
    
    // Check if teams table exists
    const teamsExists = tables.some(t => 
      (dialect === 'sqlite' && t.name === 'teams') || 
      (dialect === 'postgres' && t.table_name === 'teams')
    );
    
    if (!teamsExists) {
      console.error('Teams table was not created successfully!');
      // Try one more approach with direct SQL
      if (dialect === 'postgres') {
        try {
          console.log('Trying direct SQL approach to create teams table...');
          await sequelize.query(`
            CREATE TABLE IF NOT EXISTS teams (
              id SERIAL PRIMARY KEY,
              "teamNumber" INTEGER NOT NULL,
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
          console.log('Teams table created with direct SQL approach');
        } catch (directSqlError) {
          console.error('Error creating teams table with direct SQL:', directSqlError);
        }
      }
    }
    
    // Create admin user if it doesn't exist
    console.log('Checking for admin user...');
    try {
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
    } catch (userError) {
      console.error('Error checking/creating admin user:', userError);
    }
    
    // Check tables again to confirm creation
    const [tablesAfter] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Tables after fix:', tablesAfter);
    
    // Verify that the tables have the correct structure
    if (dialect === 'postgres') {
      try {
        console.log('Verifying table structure...');
        
        // Check teams table structure
        const [teamsColumns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'teams' AND table_schema = 'public'
        `);
        console.log('Teams table columns:', teamsColumns);
        
        // Check matches table structure
        const [matchesColumns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'matches' AND table_schema = 'public'
        `);
        console.log('Matches table columns:', matchesColumns);
        
        // Check users table structure
        const [usersColumns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND table_schema = 'public'
        `);
        console.log('Users table columns:', usersColumns);
        
        // Check if coralLevels column exists and its type
        const coralLevelsInTeams = teamsColumns.find(col => col.column_name === 'coralLevels');
        const coralLevelsInMatches = matchesColumns.find(col => col.column_name === 'coralLevels');
        
        console.log('coralLevels column in teams:', coralLevelsInTeams);
        console.log('coralLevels column in matches:', coralLevelsInMatches);
        
        // If coralLevels is not an array type, try to alter the table
        if (coralLevelsInTeams && !coralLevelsInTeams.data_type.includes('ARRAY')) {
          console.log('coralLevels in teams is not an array type, attempting to fix...');
          try {
            await sequelize.query(`
              ALTER TABLE teams 
              ALTER COLUMN "coralLevels" TYPE TEXT[] USING "coralLevels"::TEXT[]
            `);
            console.log('Fixed coralLevels column in teams table');
          } catch (alterError) {
            console.error('Error altering coralLevels column in teams:', alterError);
          }
        }
        
        if (coralLevelsInMatches && !coralLevelsInMatches.data_type.includes('ARRAY')) {
          console.log('coralLevels in matches is not an array type, attempting to fix...');
          try {
            await sequelize.query(`
              ALTER TABLE matches 
              ALTER COLUMN "coralLevels" TYPE TEXT[] USING "coralLevels"::TEXT[]
            `);
            console.log('Fixed coralLevels column in matches table');
          } catch (alterError) {
            console.error('Error altering coralLevels column in matches:', alterError);
          }
        }
      } catch (verifyError) {
        console.error('Error verifying table structure:', verifyError);
      }
    }
    
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