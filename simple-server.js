const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Create Express app
const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at: ${uploadsDir}`);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Create a SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

// Define models
const Team = sequelize.define('Team', {
  teamNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  autoScoreCoral: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  autoScoreAlgae: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  mustStartSpecificPosition: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  autoStartingPosition: {
    type: DataTypes.STRING,
    allowNull: true
  },
  teleopDealgifying: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  teleopPreference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scoringPreference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coralLevels: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const value = this.getDataValue('coralLevels');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('coralLevels', JSON.stringify(value || []));
    }
  },
  endgameType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'none'
  },
  robotWidth: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  robotLength: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  robotHeight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  robotWeight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  drivetrainType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'teams'
});

const Match = sequelize.define('Match', {
  matchNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  teamNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  autoScoreCoral: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  autoScoreAlgae: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  autoStartingPosition: {
    type: DataTypes.STRING,
    allowNull: true
  },
  teleopDealgifying: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  teleopPreference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scoringPreference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coralLevels: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const value = this.getDataValue('coralLevels');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('coralLevels', JSON.stringify(value || []));
    }
  },
  endgameType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'none'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  }
}, {
  tableName: 'matches',
  indexes: [
    {
      unique: true,
      fields: ['matchNumber', 'teamNumber']
    }
  ]
});

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  teamNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'users'
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Scouting App API is running',
    environment: process.env.NODE_ENV || 'development',
    uploadsDir: uploadsDir
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database status route
app.get('/db-status', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    res.json({ 
      status: 'connected',
      tables,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Setup database route
app.post('/setup-database', async (req, res) => {
  try {
    console.log('Setting up database...');
    
    // Sync models with database
    await sequelize.sync({ force: true });
    console.log('Database synced');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('otisit!!!', 10);
    await User.create({
      name: 'Admin',
      email: '1334admin@gmail.com',
      password: hashedPassword,
      teamNumber: 1334
    });
    console.log('Admin user created');
    
    res.json({ 
      status: 'success',
      message: 'Database setup completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    res.status(500).json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Team routes
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.findAll();
    res.json(teams);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error fetching teams', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { teamNumber } = req.body;
    
    if (!teamNumber) {
      throw new Error('Team number is required');
    }
    
    // Check if team exists
    let team = await Team.findOne({ where: { teamNumber } });
    
    if (team) {
      // Update existing team
      await team.update(req.body);
      res.status(200).json(team);
    } else {
      // Create new team
      team = await Team.create(req.body);
      res.status(201).json(team);
    }
  } catch (error) {
    res.status(400).json({ 
      error: 'Error creating team', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Match routes
app.get('/api/matches', async (req, res) => {
  try {
    const matches = await Match.findAll();
    res.json(matches);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error fetching matches', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const { matchNumber, teamNumber } = req.body;
    
    if (!matchNumber || !teamNumber) {
      throw new Error('Match number and team number are required');
    }
    
    // Check if match exists
    let match = await Match.findOne({ 
      where: { 
        matchNumber,
        teamNumber
      } 
    });
    
    if (match) {
      // Update existing match
      await match.update(req.body);
      res.status(200).json(match);
    } else {
      // Create new match
      match = await Match.create(req.body);
      res.status(201).json(match);
    }
  } catch (error) {
    res.status(400).json({ 
      error: 'Error creating match', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server
async function startServer() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Start the server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Uploads directory: ${uploadsDir}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 