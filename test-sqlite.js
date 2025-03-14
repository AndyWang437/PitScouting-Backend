const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Create a SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './test-database.sqlite',
  logging: console.log
});

// Define a simple model
const Team = sequelize.define('Team', {
  teamNumber: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  tableName: 'teams'
});

// Test the connection and create a table
async function testDatabase() {
  try {
    console.log('Testing SQLite connection...');
    
    // Authenticate
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Sync the model (create the table)
    await Team.sync({ force: true });
    console.log('Team table has been created.');
    
    // Create a team
    const team = await Team.create({
      teamNumber: 1334,
      name: 'Red Devils'
    });
    console.log('Team created:', team.toJSON());
    
    // Find the team
    const foundTeam = await Team.findOne({ where: { teamNumber: 1334 } });
    console.log('Found team:', foundTeam.toJSON());
    
    console.log('SQLite test completed successfully!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

testDatabase(); 