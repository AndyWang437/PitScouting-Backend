const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

// Database configuration
let sequelize;
if (isProduction) {
  // Production database (PostgreSQL)
  const dbUrl = process.env.DATABASE_URL;
  console.log(`Using production database URL: ${dbUrl}`);
  
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Development database (SQLite)
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  console.log(`Using development database at: ${dbPath}`);
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
}

async function createTestTeam() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Check if teams table exists
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='teams'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const teamsTableExists = tables.length > 0;
    console.log(`Teams table exists: ${teamsTableExists}`);
    
    if (!teamsTableExists) {
      console.error('Teams table does not exist. Please run database setup first.');
      return;
    }
    
    // Check if team 1334 already exists
    const existingTeam = await sequelize.query(
      "SELECT * FROM teams WHERE teamNumber = 1334",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (existingTeam.length > 0) {
      console.log('Team 1334 already exists in the database.');
      return;
    }
    
    // Create test team
    const insertQuery = `
      INSERT INTO teams (
        teamNumber, autoScoreCoral, autoScoreAlgae, mustStartSpecificPosition, 
        autoStartingPosition, teleopDealgifying, teleopPreference, 
        scoringPreference, coralLevels, endgameType, robotWidth, 
        robotLength, robotHeight, robotWeight, drivetrainType, notes,
        createdAt, updatedAt
      ) VALUES (
        1334, 1, 1, 0, 
        'Middle', 1, 'Coral', 
        'High', '[1, 2, 3]', 'Climb', 30, 
        30, 30, 120, 'Tank', 'This is a test team created for debugging purposes.',
        datetime('now'), datetime('now')
      )
    `;
    
    await sequelize.query(insertQuery);
    console.log('Test team 1334 created successfully!');
    
    // Verify team was created
    const team = await sequelize.query(
      "SELECT * FROM teams WHERE teamNumber = 1334",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Team created:', team[0]);
    
  } catch (error) {
    console.error('Error creating test team:', error);
  } finally {
    await sequelize.close();
  }
}

createTestTeam(); 