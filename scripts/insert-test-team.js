const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

async function insertTestTeam() {
  console.log('Inserting test team with number 1334...');
  
  // Use SQLite database in development
  const dbPath = './database.sqlite';
  console.log(`Using SQLite database at: ${dbPath}`);
  
  // Create Sequelize instance
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Check if team 1334 already exists
    const [existingTeams] = await sequelize.query(
      `SELECT * FROM teams WHERE "teamNumber" = 1334`
    );
    
    if (existingTeams && existingTeams.length > 0) {
      console.log('Team 1334 already exists:', existingTeams[0]);
      console.log('Deleting existing team 1334 to recreate it...');
      
      await sequelize.query(
        `DELETE FROM teams WHERE "teamNumber" = 1334`
      );
      console.log('Existing team 1334 deleted.');
    }
    
    // Create test team with direct SQL
    const coralLevels = JSON.stringify(['Level 1', 'Level 2', 'Level 3']);
    
    const insertQuery = `
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
    `;
    
    console.log('Executing insert query...');
    await sequelize.query(insertQuery);
    
    // Verify team was created
    const [teams] = await sequelize.query(
      `SELECT * FROM teams WHERE "teamNumber" = 1334`
    );
    
    if (teams && teams.length > 0) {
      console.log('Team 1334 created successfully:');
      console.log(JSON.stringify(teams[0], null, 2));
    } else {
      console.error('Failed to create team 1334');
    }
    
  } catch (error) {
    console.error('Error creating test team:', error);
  } finally {
    await sequelize.close();
  }
}

insertTestTeam()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 