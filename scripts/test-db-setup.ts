import { sequelize } from '../src/db/init';
import { setupDatabase } from '../src/db/setup';
import { Team, Match } from '../src/models';

// Define interfaces for database records
interface TeamRecord {
  id: number;
  teamNumber: number;
  coralLevels: string | string[];
  [key: string]: any;
}

interface MatchRecord {
  id: number;
  matchNumber: number;
  teamNumber: number;
  coralLevels: string | string[];
  [key: string]: any;
}

async function testDatabaseSetup() {
  try {
    console.log('Testing database setup...');
    console.log('Database dialect:', sequelize.getDialect());
    
    // Initialize the database
    await setupDatabase();
    
    // Test creating a team with array data
    console.log('\nTesting team creation with array data...');
    const teamData = {
      teamNumber: 9999,
      autoScoreCoral: true,
      autoScoreAlgae: false,
      mustStartSpecificPosition: true,
      autoStartingPosition: 'left',
      teleopDealgifying: true,
      teleopPreference: 'high',
      scoringPreference: 'coral',
      coralLevels: ['level1', 'level2', 'level3'],
      endgameType: 'climb',
      robotWidth: 30.5,
      robotLength: 40.2,
      robotHeight: 25.7,
      robotWeight: 120.3,
      drivetrainType: 'tank',
      notes: 'Test team',
      imageUrl: null
    };
    
    // Create or update the team
    let team;
    try {
      team = await Team.findOne({ where: { teamNumber: 9999 } });
      if (team) {
        console.log('Test team exists, updating...');
        await team.update(teamData);
      } else {
        console.log('Creating test team...');
        team = await Team.create(teamData);
      }
      console.log('Team created/updated successfully:', team.id);
    } catch (error) {
      console.error('Error creating/updating team:', error);
      throw error;
    }
    
    // Retrieve the team and check the array data
    console.log('\nRetrieving team to check array data...');
    const retrievedTeam = await Team.findOne({ where: { teamNumber: 9999 } });
    if (!retrievedTeam) {
      throw new Error('Failed to retrieve test team');
    }
    
    console.log('Retrieved team:', retrievedTeam.id);
    console.log('coralLevels type:', typeof retrievedTeam.coralLevels);
    console.log('coralLevels value:', retrievedTeam.coralLevels);
    
    if (sequelize.getDialect() === 'sqlite') {
      console.log('Using getCoralLevelsArray() for SQLite:', retrievedTeam.getCoralLevelsArray());
    }
    
    // Test creating a match with array data
    console.log('\nTesting match creation with array data...');
    const matchData = {
      matchNumber: 999,
      teamNumber: 9999,
      autoScoreCoral: true,
      autoScoreAlgae: false,
      autoStartingPosition: 'right',
      teleopDealgifying: true,
      teleopPreference: 'low',
      scoringPreference: 'algae',
      coralLevels: ['level4', 'level5'],
      endgameType: 'park',
      notes: 'Test match'
    };
    
    // Create or update the match
    let match;
    try {
      match = await Match.findOne({ 
        where: { 
          matchNumber: 999,
          teamNumber: 9999
        } 
      });
      
      if (match) {
        console.log('Test match exists, updating...');
        await match.update(matchData);
      } else {
        console.log('Creating test match...');
        match = await Match.create(matchData);
      }
      console.log('Match created/updated successfully:', match.id);
    } catch (error) {
      console.error('Error creating/updating match:', error);
      throw error;
    }
    
    // Retrieve the match and check the array data
    console.log('\nRetrieving match to check array data...');
    const retrievedMatch = await Match.findOne({ 
      where: { 
        matchNumber: 999,
        teamNumber: 9999
      } 
    });
    
    if (!retrievedMatch) {
      throw new Error('Failed to retrieve test match');
    }
    
    console.log('Retrieved match:', retrievedMatch.id);
    console.log('coralLevels type:', typeof retrievedMatch.coralLevels);
    console.log('coralLevels value:', retrievedMatch.coralLevels);
    
    if (sequelize.getDialect() === 'sqlite') {
      console.log('Using getCoralLevelsArray() for SQLite:', retrievedMatch.getCoralLevelsArray());
    }
    
    // Test direct SQL queries
    console.log('\nTesting direct SQL queries...');
    const isSqlite = sequelize.getDialect() === 'sqlite';
    
    // Query team
    const [teamsResult] = await sequelize.query(
      `SELECT * FROM teams WHERE "teamNumber" = 9999`
    );
    
    if (teamsResult.length === 0) {
      throw new Error('Failed to retrieve test team via SQL');
    }
    
    const teamRecord = teamsResult[0] as TeamRecord;
    console.log('Retrieved team via SQL:', teamRecord.id);
    console.log('coralLevels type:', typeof teamRecord.coralLevels);
    console.log('coralLevels value:', teamRecord.coralLevels);
    
    if (isSqlite && typeof teamRecord.coralLevels === 'string') {
      console.log('Parsed coralLevels from SQL:', JSON.parse(teamRecord.coralLevels));
    }
    
    // Query match
    const [matchesResult] = await sequelize.query(
      `SELECT * FROM matches WHERE "matchNumber" = 999 AND "teamNumber" = 9999`
    );
    
    if (matchesResult.length === 0) {
      throw new Error('Failed to retrieve test match via SQL');
    }
    
    const matchRecord = matchesResult[0] as MatchRecord;
    console.log('Retrieved match via SQL:', matchRecord.id);
    console.log('coralLevels type:', typeof matchRecord.coralLevels);
    console.log('coralLevels value:', matchRecord.coralLevels);
    
    if (isSqlite && typeof matchRecord.coralLevels === 'string') {
      console.log('Parsed coralLevels from SQL:', JSON.parse(matchRecord.coralLevels));
    }
    
    console.log('\nDatabase test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the test
testDatabaseSetup(); 