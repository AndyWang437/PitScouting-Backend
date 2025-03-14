const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

// Create Express app
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create a SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './test-database.sqlite',
  logging: console.log
});

// Define a simple model
const Team = sequelize.define('Team', {
  teamNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'teams'
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.get('/teams', async (req, res) => {
  try {
    const teams = await Team.findAll();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/teams', async (req, res) => {
  try {
    const { teamNumber, name } = req.body;
    
    if (!teamNumber) {
      return res.status(400).json({ error: 'Team number is required' });
    }
    
    // Check if team exists
    let team = await Team.findOne({ where: { teamNumber } });
    
    if (team) {
      // Update existing team
      await team.update({ name });
      res.status(200).json(team);
    } else {
      // Create new team
      team = await Team.create({ teamNumber, name });
      res.status(201).json(team);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const startServer = async () => {
  try {
    // Check if teams table exists
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='teams'");
    console.log('Teams table exists:', tables.length > 0);
    
    // Start the server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer(); 