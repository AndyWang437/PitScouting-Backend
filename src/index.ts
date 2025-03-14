import express = require('express');
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { sequelize } from './db/init';
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import matchRoutes from './routes/matches';
import testRoutes from './routes/test-routes';
import { initDb } from './db/init';
import { setupDatabase } from './db/setup';

const app = express();
const port = parseInt(process.env.PORT || '10000', 10);
const env = process.env.NODE_ENV || 'development';

// Update CORS configuration to only allow your deployed frontend
app.use(cors({
  origin: '*', // Allow all origins temporarily for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Add CORS preflight handler for all routes
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up static file serving for uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
console.log('Uploads directory:', uploadsDir);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Also serve files from /api/storage for backward compatibility
app.use('/api/storage', express.static(uploadsDir));

// Add a route to check if an image exists
app.get('/check-image/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const imagePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(imagePath)) {
    res.json({ 
      exists: true, 
      path: imagePath,
      accessibleViaUploads: `/uploads/${filename}`,
      accessibleViaApiStorage: `/api/storage/${filename}`
    });
  } else {
    res.status(404).json({ 
      exists: false, 
      path: imagePath,
      message: 'Image not found'
    });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Scouting App API is running',
    environment: env,
    corsOrigin: '*', // Updated to match our CORS configuration
    uploadsDir: uploadsDir,
    databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set'
  });
});

// Add a test endpoint
app.get('/test', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Add a test endpoint for team details
app.get('/test-team/:teamNumber', async (req: Request, res: Response) => {
  try {
    const teamNumber = parseInt(req.params.teamNumber);
    
    if (isNaN(teamNumber)) {
      res.status(400).json({ error: 'Invalid team number' });
      return;
    }

    // Try direct SQL approach
    const dialect = sequelize.getDialect();
    console.log('Database dialect:', dialect);
    
    const [teams] = await sequelize.query(
      `SELECT * FROM teams WHERE "teamNumber" = ${teamNumber}`
    );
    
    if (!teams || teams.length === 0) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    
    const team = teams[0] as any; // Type as any to avoid TypeScript errors
    
    // Parse coralLevels if it's a string
    if (typeof team.coralLevels === 'string') {
      try {
        team.coralLevels = JSON.parse(team.coralLevels);
      } catch (error) {
        console.error('Error parsing coralLevels:', error);
        team.coralLevels = [];
      }
    } else if (!team.coralLevels) {
      team.coralLevels = [];
    }
    
    res.json({
      message: 'Team details test endpoint',
      team,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test-team endpoint:', error);
    res.status(500).json({ 
      error: 'Error fetching team', 
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Add a simple endpoint to insert a test team
app.get('/insert-test-team', async (_req: Request, res: Response) => {
  try {
    // Check if teams table exists
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='teams'"
    );
    
    const teamsTableExists = tables.length > 0;
    console.log(`Teams table exists: ${teamsTableExists}`);
    
    if (!teamsTableExists) {
      return res.status(500).json({ 
        error: 'Teams table does not exist. Please run database setup first.' 
      });
    }
    
    // Check if team 1334 already exists
    const [existingTeams] = await sequelize.query(
      "SELECT * FROM teams WHERE teamNumber = 1334"
    );
    
    if (existingTeams && existingTeams.length > 0) {
      return res.json({ 
        message: 'Team 1334 already exists in the database.',
        team: existingTeams[0]
      });
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
    
    // Verify team was created
    const [teams] = await sequelize.query(
      "SELECT * FROM teams WHERE teamNumber = 1334"
    );
    
    if (teams && teams.length > 0) {
      return res.json({ 
        message: 'Test team 1334 created successfully!',
        team: teams[0]
      });
    } else {
      return res.status(500).json({ error: 'Failed to create team 1334' });
    }
    
  } catch (error) {
    console.error('Error creating test team:', error);
    return res.status(500).json({ 
      error: 'Error creating test team', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Add this function before the app.get('/health') endpoint
const checkDatabaseTables = async () => {
  try {
    const dialect = sequelize.getDialect();
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    const tableNames = dialect === 'sqlite'
      ? tables.map((t: any) => t.name)
      : tables.map((t: any) => t.table_name);
    
    console.log('Database tables:', tableNames);
    
    const requiredTables = ['teams', 'matches', 'users'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.error('Missing required tables:', missingTables);
      return {
        status: 'error',
        message: 'Missing required tables',
        details: {
          missingTables,
          existingTables: tableNames
        }
      };
    }
    
    // Check if tables have data
    const tableData: Record<string, number> = {};
    
    for (const table of requiredTables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = (result[0] as { count: string | number }).count;
        tableData[table] = typeof count === 'number' ? count : parseInt(count);
      } catch (countError) {
        console.error(`Error counting rows in ${table}:`, countError);
        tableData[table] = -1; // Error indicator
      }
    }
    
    return {
      status: 'ok',
      message: 'All required tables exist',
      details: {
        tables: tableNames,
        counts: tableData
      }
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      status: 'error',
      message: 'Error checking database tables',
      details: error instanceof Error ? error.message : String(error)
    };
  }
};

// Update the health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Add a more detailed database status endpoint
app.get('/db-status', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseTables();
    res.status(dbStatus.status === 'ok' ? 200 : 500).json(dbStatus);
  } catch (error) {
    console.error('Error checking database status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking database status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Setup database and run migrations route
app.post('/setup-database', async (_req: Request, res: Response) => {
  try {
    console.log('Manually triggering database setup...');
    await setupDatabase();
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

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/', testRoutes);

// Add a route to handle image paths with the correct URL structure
app.get('/api/storage/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Redirect old image paths to the new format
app.get('/uploads/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Function to check if tables exist
async function checkTablesExist() {
  try {
    const dialect = sequelize.getDialect();
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name='teams'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams'"
    );
    
    return tables && tables.length > 0;
  } catch (error) {
    console.error('Error checking if tables exist:', error);
    return false;
  }
}

// Function to create tables directly with SQL
async function createTablesDirectly() {
  console.log('Creating tables directly with SQL...');
  try {
    if (sequelize.getDialect() === 'postgres') {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS teams (
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
        );
        
        CREATE TABLE IF NOT EXISTS matches (
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
        );
        
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          "teamNumber" INTEGER NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      
      console.log('Tables created with direct SQL approach');
      return true;
    } else {
      console.log('Not using PostgreSQL, skipping direct table creation');
      return false;
    }
  } catch (error) {
    console.error('Error creating tables with direct SQL:', error);
    return false;
  }
}

// Add a test HTML page
app.get('/test-page', (_req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>API Test Page</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        button { margin: 10px 0; padding: 8px 16px; cursor: pointer; }
        #result { margin-top: 20px; padding: 10px; border: 1px solid #ddd; min-height: 200px; }
        pre { white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>API Test Page</h1>
      <div>
        <label for="teamNumber">Team Number:</label>
        <input type="number" id="teamNumber" value="1334" />
        <button onclick="fetchTeam()">Fetch Team</button>
      </div>
      <div>
        <button onclick="fetchAllTeams()">Fetch All Teams</button>
      </div>
      <div id="result">
        <p>Results will appear here...</p>
      </div>

      <script>
        function fetchTeam() {
          const teamNumber = document.getElementById('teamNumber').value;
          const resultDiv = document.getElementById('result');
          
          resultDiv.innerHTML = '<p>Loading...</p>';
          
          fetch('/api/teams/' + teamNumber)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
              }
              return response.json();
            })
            .then(data => {
              resultDiv.innerHTML = '<h3>Team Details:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            })
            .catch(error => {
              resultDiv.innerHTML = '<h3>Error:</h3><pre>' + error + '</pre>';
              console.error('Error fetching team:', error);
            });
        }
        
        function fetchAllTeams() {
          const resultDiv = document.getElementById('result');
          
          resultDiv.innerHTML = '<p>Loading...</p>';
          
          fetch('/api/teams')
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
              }
              return response.json();
            })
            .then(data => {
              resultDiv.innerHTML = '<h3>All Teams:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            })
            .catch(error => {
              resultDiv.innerHTML = '<h3>Error:</h3><pre>' + error + '</pre>';
              console.error('Error fetching teams:', error);
            });
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Add a test HTML page with CORS debugging
app.get('/test-cors', (_req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CORS Test Page</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        button { margin: 10px 0; padding: 8px 16px; cursor: pointer; }
        #result { margin-top: 20px; padding: 10px; border: 1px solid #ddd; min-height: 200px; }
        pre { white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>CORS Test Page</h1>
      <div>
        <label for="apiUrl">API URL:</label>
        <input type="text" id="apiUrl" value="https://1334pitscouting.onrender.com/api/teams/1334" style="width: 400px;" />
        <button onclick="testCors()">Test CORS</button>
      </div>
      <div id="result">
        <p>Results will appear here...</p>
      </div>

      <script>
        function testCors() {
          const apiUrl = document.getElementById('apiUrl').value;
          const resultDiv = document.getElementById('result');
          
          resultDiv.innerHTML = '<p>Loading...</p>';
          
          fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          })
            .then(response => {
              resultDiv.innerHTML += '<p>Response status: ' + response.status + '</p>';
              if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
              }
              return response.json();
            })
            .then(data => {
              resultDiv.innerHTML = '<h3>Response:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            })
            .catch(error => {
              resultDiv.innerHTML = '<h3>Error:</h3><pre>' + error + '</pre>';
              console.error('Error testing CORS:', error);
            });
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Add a simple HTML page to test team details
app.get('/test-team-page', (_req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Team Details Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { padding: 8px; width: 100%; max-width: 300px; }
        button { padding: 8px 16px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
        .error { color: red; }
        .success { color: green; }
        .team-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .team-info div { padding: 5px; }
        .team-info strong { font-weight: bold; }
        .coral-levels { margin-top: 10px; }
        .coral-level { display: inline-block; background: #e0f7fa; padding: 5px 10px; margin-right: 5px; border-radius: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Team Details Test</h1>
        
        <div class="card">
          <div class="form-group">
            <label for="team-number">Team Number:</label>
            <input type="text" id="team-number" value="1334" />
          </div>
          <button onclick="fetchTeam()">Get Team Details</button>
          
          <div id="result" class="form-group" style="margin-top: 20px;">
            <p>Enter a team number and click "Get Team Details" to see the team information.</p>
          </div>
        </div>
      </div>
      
      <script>
        // Format boolean values
        function formatBoolean(value) {
          return value ? 'Yes' : 'No';
        }
        
        // Format null values
        function formatValue(value) {
          if (value === null || value === undefined) return 'N/A';
          return value;
        }
        
        // Parse coral levels
        function parseCoralLevels(coralLevels) {
          if (!coralLevels) return [];
          
          if (typeof coralLevels === 'string') {
            try {
              return JSON.parse(coralLevels);
            } catch (e) {
              console.error('Error parsing coralLevels:', e);
              return [];
            }
          }
          
          return Array.isArray(coralLevels) ? coralLevels : [];
        }
        
        // Fetch team details
        async function fetchTeam() {
          const resultDiv = document.getElementById('result');
          const teamNumber = document.getElementById('team-number').value;
          
          if (!teamNumber) {
            resultDiv.innerHTML = '<p class="error">Please enter a team number</p>';
            return;
          }
          
          resultDiv.innerHTML = '<p>Loading team details...</p>';
          
          try {
            const response = await fetch('/api/teams/' + teamNumber);
            
            if (!response.ok) {
              throw new Error('Network response was not ok: ' + response.status);
            }
            
            const team = await response.json();
            console.log('Team data:', team);
            
            // Parse coral levels
            team.coralLevels = parseCoralLevels(team.coralLevels);
            
            // Create HTML for team details
            let html = '<h2>Team ' + team.teamNumber + '</h2>';
            
            // Team info grid
            html += '<div class="team-info">';
            html += '<div><strong>Auto Score Coral:</strong> ' + formatBoolean(team.autoScoreCoral) + '</div>';
            html += '<div><strong>Auto Score Algae:</strong> ' + formatBoolean(team.autoScoreAlgae) + '</div>';
            html += '<div><strong>Must Start Specific Position:</strong> ' + formatBoolean(team.mustStartSpecificPosition) + '</div>';
            html += '<div><strong>Auto Starting Position:</strong> ' + formatValue(team.autoStartingPosition) + '</div>';
            html += '<div><strong>Teleop Dealgifying:</strong> ' + formatBoolean(team.teleopDealgifying) + '</div>';
            html += '<div><strong>Teleop Preference:</strong> ' + formatValue(team.teleopPreference) + '</div>';
            html += '<div><strong>Scoring Preference:</strong> ' + formatValue(team.scoringPreference) + '</div>';
            html += '<div><strong>Endgame Type:</strong> ' + formatValue(team.endgameType) + '</div>';
            html += '<div><strong>Robot Width:</strong> ' + formatValue(team.robotWidth) + '</div>';
            html += '<div><strong>Robot Length:</strong> ' + formatValue(team.robotLength) + '</div>';
            html += '<div><strong>Robot Height:</strong> ' + formatValue(team.robotHeight) + '</div>';
            html += '<div><strong>Robot Weight:</strong> ' + formatValue(team.robotWeight) + '</div>';
            html += '<div><strong>Drivetrain Type:</strong> ' + formatValue(team.drivetrainType) + '</div>';
            html += '</div>';
            
            // Coral levels
            html += '<div class="coral-levels"><strong>Coral Levels:</strong> ';
            
            if (team.coralLevels && team.coralLevels.length > 0) {
              team.coralLevels.forEach(level => {
                html += '<span class="coral-level">' + level + '</span>';
              });
            } else {
              html += '<span>None</span>';
            }
            
            html += '</div>';
            
            // Notes
            html += '<div style="margin-top: 15px;">';
            html += '<strong>Notes:</strong>';
            html += '<div>' + formatValue(team.notes) + '</div>';
            html += '</div>';
            
            // Raw data
            html += '<div style="margin-top: 15px;">';
            html += '<strong>Raw Data:</strong>';
            html += '<pre>' + JSON.stringify(team, null, 2) + '</pre>';
            html += '</div>';
            
            resultDiv.innerHTML = html;
          } catch (error) {
            console.error('Error fetching team:', error);
            resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
          }
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Add a diagnostic page for frontend debugging
app.get('/frontend-debug', (_req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Frontend Debugging Tool</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { padding: 8px; width: 100%; max-width: 300px; }
        button { padding: 8px 16px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
        .error { color: red; }
        .success { color: green; }
        .section { margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Frontend Debugging Tool</h1>
        
        <div class="section">
          <h2>API Test</h2>
          <div class="card">
            <p>Test if the API is working correctly</p>
            <button onclick="testAPI()">Test API</button>
            <div id="api-result" class="form-group"></div>
          </div>
        </div>
        
        <div class="section">
          <h2>CORS Test</h2>
          <div class="card">
            <p>Test if CORS is configured correctly</p>
            <div class="form-group">
              <label for="cors-url">API URL:</label>
              <input type="text" id="cors-url" value="http://localhost:10000/api/teams" />
            </div>
            <button onclick="testCORS()">Test CORS</button>
            <div id="cors-result" class="form-group"></div>
          </div>
        </div>
        
        <div class="section">
          <h2>Team Details Test</h2>
          <div class="card">
            <p>Test if team details can be retrieved</p>
            <div class="form-group">
              <label for="team-number">Team Number:</label>
              <input type="text" id="team-number" value="1334" />
            </div>
            <button onclick="testTeam()">Get Team</button>
            <div id="team-result" class="form-group"></div>
          </div>
        </div>
      </div>
      
      <script>
        // Test API endpoint
        async function testAPI() {
          const resultDiv = document.getElementById('api-result');
          resultDiv.innerHTML = 'Testing API...';
          
          try {
            const response = await fetch('/api/teams');
            const data = await response.json();
            
            resultDiv.innerHTML = '<p class="success">API is working!</p><pre>' + 
              JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
          }
        }
        
        // Test CORS
        async function testCORS() {
          const resultDiv = document.getElementById('cors-result');
          const url = document.getElementById('cors-url').value;
          
          resultDiv.innerHTML = 'Testing CORS with URL: ' + url;
          
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            resultDiv.innerHTML = '<p class="success">CORS is working!</p><pre>' + 
              JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            resultDiv.innerHTML = '<p class="error">CORS Error: ' + error.message + '</p>';
          }
        }
        
        // Test Team Details
        async function testTeam() {
          const resultDiv = document.getElementById('team-result');
          const teamNumber = document.getElementById('team-number').value;
          
          resultDiv.innerHTML = 'Fetching team ' + teamNumber + '...';
          
          try {
            const response = await fetch('/api/teams/' + teamNumber);
            
            if (!response.ok) {
              throw new Error('Network response was not ok: ' + response.status);
            }
            
            const team = await response.json();
            
            // Check if coralLevels is present and parse it if needed
            if (team.coralLevels) {
              if (typeof team.coralLevels === 'string') {
                try {
                  team.coralLevels = JSON.parse(team.coralLevels);
                } catch (e) {
                  console.error('Error parsing coralLevels:', e);
                }
              }
            }
            
            resultDiv.innerHTML = '<p class="success">Team found!</p><pre>' + 
              JSON.stringify(team, null, 2) + '</pre>';
          } catch (error) {
            resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
          }
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

const startServer = async () => {
  try {
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialized successfully');
    
    console.log('Setting up database (creating tables and admin user)...');
    await setupDatabase();
    console.log('Database setup completed successfully');
    
    // Verify tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      console.error('Tables do not exist after setup! Attempting to create tables again...');
      
      // Try one more time with setupDatabase
      try {
        console.log('Retrying database setup...');
        await setupDatabase();
        console.log('Database setup retry completed');
        
        // Check again
        const tablesExistAfterRetry = await checkTablesExist();
        if (!tablesExistAfterRetry) {
          console.error('Tables still do not exist after retry! Attempting direct SQL approach...');
          
          // Try direct SQL approach
          const directSuccess = await createTablesDirectly();
          if (directSuccess) {
            console.log('Tables created successfully with direct SQL approach');
          } else {
            console.error('CRITICAL: Failed to create tables with direct SQL approach!');
          }
        } else {
          console.log('Tables created successfully after retry');
        }
      } catch (retryError) {
        console.error('Error during database setup retry:', retryError);
        
        // Try direct SQL approach as last resort
        const directSuccess = await createTablesDirectly();
        if (directSuccess) {
          console.log('Tables created successfully with direct SQL approach after retry error');
        } else {
          console.error('CRITICAL: Failed to create tables with any method!');
        }
      }
    }
    
    console.log('Starting server...');
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${env}`);
      console.log(`Uploads directory: ${uploadsDir}`);
      console.log('API endpoints:');
      console.log('- POST /api/auth/login');
      console.log('- POST /api/auth/register');
      console.log('- GET /api/teams');
      console.log('- POST /api/teams');
      console.log('- GET /api/teams/:teamNumber');
      console.log('- GET /api/matches');
      console.log('- POST /api/matches');
      console.log('- GET /uploads/:filename (for images)');
      console.log('- GET /health (health check)');
      console.log('- GET /db-status (database status)');
      console.log('- POST /setup-database (manually trigger database setup)');
      console.log('- GET /test (test endpoint)');
      console.log('- GET /test-team/:teamNumber (test team details)');
      console.log('- GET /test-page (test HTML page)');
      console.log('- GET /test-cors (test CORS)');
      console.log('- GET /test-team-page (test team details page)');
      console.log('- GET /insert-test-team (insert test team 1334)');
      console.log('- GET /frontend-debug (frontend debugging tool)');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
};

startServer();

export default app; 