const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

async function createTestTeam() {
  console.log('Creating test team with number 1334...');
  
  // Determine environment and database configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const dbUrl = process.env.DATABASE_URL || 'sqlite:./database.sqlite';
  
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`Database URL: ${dbUrl.substring(0, 20)}...`);
  
  // Create Sequelize instance
  let sequelize;
  
  if (isProduction && dbUrl.startsWith('postgres')) {
    // Production PostgreSQL configuration
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
    // Development SQLite configuration
    sequelize = new Sequelize(dbUrl, {
      logging: false
    });
  }
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Check if teams table exists
    const dialect = sequelize.getDialect();
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name='teams'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams'"
    );
    
    const tableExists = tables.length > 0;
    console.log('Teams table exists:', tableExists);
    
    if (!tableExists) {
      console.error('Teams table does not exist. Please run database setup first.');
      process.exit(1);
    }
    
    // Check if team 1334 already exists
    const [existingTeams] = await sequelize.query(
      `SELECT * FROM teams WHERE "teamNumber" = 1334`
    );
    
    if (existingTeams && existingTeams.length > 0) {
      console.log('Team 1334 already exists:', existingTeams[0]);
      process.exit(0);
    }
    
    // Create test team
    const isSqlite = dialect === 'sqlite';
    const coralLevels = JSON.stringify(['Level 1', 'Level 2', 'Level 3']);
    
    const insertQuery = isSqlite
      ? `
        INSERT INTO teams (
          "teamNumber", 
          "autoScoreCoral", 
          "autoScoreAlgae", 
          "mustStartSpecificPosition", 
          "autoStartingPosition", 
          "teleopDealgifying", 
          "teleopPreference", 
          "scoringPreference", 
          "coralLevels", 
          "endgameType", 
          "robotWidth", 
          "robotLength", 
          "robotHeight", 
          "robotWeight", 
          "drivetrainType", 
          "notes", 
          "createdAt", 
          "updatedAt"
        ) 
        VALUES (
          1334, 
          1, 
          1, 
          0, 
          'Left', 
          1, 
          'Scoring', 
          'High', 
          '${coralLevels}', 
          'climb', 
          30.5, 
          32.0, 
          24.0, 
          120.0, 
          'Swerve', 
          'This is a test team for Team 1334 - Red Devils.', 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
      `
      : `
        INSERT INTO teams (
          "teamNumber", 
          "autoScoreCoral", 
          "autoScoreAlgae", 
          "mustStartSpecificPosition", 
          "autoStartingPosition", 
          "teleopDealgifying", 
          "teleopPreference", 
          "scoringPreference", 
          "coralLevels", 
          "endgameType", 
          "robotWidth", 
          "robotLength", 
          "robotHeight", 
          "robotWeight", 
          "drivetrainType", 
          "notes", 
          "createdAt", 
          "updatedAt"
        ) 
        VALUES (
          1334, 
          true, 
          true, 
          false, 
          'Left', 
          true, 
          'Scoring', 
          'High', 
          '${coralLevels}', 
          'climb', 
          30.5, 
          32.0, 
          24.0, 
          120.0, 
          'Swerve', 
          'This is a test team for Team 1334 - Red Devils.', 
          NOW(), 
          NOW()
        )
      `;
    
    console.log('Executing insert query...');
    await sequelize.query(insertQuery);
    
    // Verify team was created
    const [teams] = await sequelize.query(
      `SELECT * FROM teams WHERE "teamNumber" = 1334`
    );
    
    if (teams && teams.length > 0) {
      console.log('Team 1334 created successfully:', teams[0]);
    } else {
      console.error('Failed to create team 1334');
    }
    
  } catch (error) {
    console.error('Error creating test team:', error);
  } finally {
    await sequelize.close();
  }
}

createTestTeam()
  .then(() => {
    console.log('Script completed');
  })
  .catch(error => {
    console.error('Script failed:', error);
  }); 