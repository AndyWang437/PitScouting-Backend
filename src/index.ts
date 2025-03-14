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
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/src/uploads'
  : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at: ${uploadsDir}`);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Add a route to check if an image exists
app.get('/check-image/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, path: `/uploads/${filename}` });
  } else {
    res.json({ exists: false });
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);

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

// Add a test HTML page for team details
app.get('/test-team-page', (_req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Team Details Test Page</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        .team-card { 
          border: 1px solid #ddd; 
          padding: 20px; 
          margin-bottom: 20px; 
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .team-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          margin-bottom: 15px;
        }
        .team-number { 
          font-size: 24px; 
          font-weight: bold; 
        }
        .team-image { 
          max-width: 300px; 
          max-height: 200px; 
          margin-bottom: 15px;
          border: 1px solid #eee;
        }
        .team-details { 
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .detail-item { 
          margin-bottom: 5px; 
        }
        .detail-label { 
          font-weight: bold; 
          margin-right: 5px;
        }
        .coral-levels {
          margin-top: 15px;
        }
        .coral-level-tag {
          display: inline-block;
          background-color: #e0f7fa;
          padding: 5px 10px;
          margin-right: 5px;
          margin-bottom: 5px;
          border-radius: 15px;
          font-size: 14px;
        }
        button { 
          margin: 10px 0; 
          padding: 8px 16px; 
          cursor: pointer; 
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
        }
        button:hover {
          background-color: #45a049;
        }
        input {
          padding: 8px;
          margin-right: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        #error-message {
          color: red;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <h1>Team Details Test Page</h1>
      <div>
        <label for="teamNumber">Team Number:</label>
        <input type="number" id="teamNumber" value="1334" />
        <button onclick="fetchTeam()">Fetch Team</button>
      </div>
      <div id="error-message"></div>
      <div id="team-container"></div>

      <script>
        function fetchTeam() {
          const teamNumber = document.getElementById('teamNumber').value;
          const teamContainer = document.getElementById('team-container');
          const errorMessage = document.getElementById('error-message');
          
          teamContainer.innerHTML = '<p>Loading...</p>';
          errorMessage.innerHTML = '';
          
          fetch('/api/teams/' + teamNumber)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
              }
              return response.json();
            })
            .then(team => {
              renderTeam(team);
            })
            .catch(error => {
              teamContainer.innerHTML = '';
              errorMessage.innerHTML = 'Error: ' + error.message;
              console.error('Error fetching team:', error);
            });
        }
        
        function renderTeam(team) {
          const teamContainer = document.getElementById('team-container');
          
          // Format boolean values
          const formatBoolean = (value) => value ? 'Yes' : 'No';
          
          // Format null values
          const formatValue = (value) => {
            if (value === null || value === undefined) return 'N/A';
            return value;
          };
          
          // Create HTML for team details
          let html = \`
            <div class="team-card">
              <div class="team-header">
                <h2 class="team-number">Team \${team.teamNumber}</h2>
              </div>
          \`;
          
          // Add image if available
          if (team.imageUrl) {
            html += \`<img src="\${team.imageUrl}" alt="Team \${team.teamNumber}" class="team-image" />\`;
          }
          
          // Add team details
          html += \`
            <div class="team-details">
              <div class="detail-item">
                <span class="detail-label">Auto Score Coral:</span>
                <span>\${formatBoolean(team.autoScoreCoral)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Auto Score Algae:</span>
                <span>\${formatBoolean(team.autoScoreAlgae)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Must Start Specific Position:</span>
                <span>\${formatBoolean(team.mustStartSpecificPosition)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Auto Starting Position:</span>
                <span>\${formatValue(team.autoStartingPosition)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Teleop Dealgifying:</span>
                <span>\${formatBoolean(team.teleopDealgifying)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Teleop Preference:</span>
                <span>\${formatValue(team.teleopPreference)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Scoring Preference:</span>
                <span>\${formatValue(team.scoringPreference)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Endgame Type:</span>
                <span>\${formatValue(team.endgameType)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Robot Width:</span>
                <span>\${formatValue(team.robotWidth)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Robot Length:</span>
                <span>\${formatValue(team.robotLength)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Robot Height:</span>
                <span>\${formatValue(team.robotHeight)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Robot Weight:</span>
                <span>\${formatValue(team.robotWeight)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Drivetrain Type:</span>
                <span>\${formatValue(team.drivetrainType)}</span>
              </div>
            </div>
          \`;
          
          // Add coral levels
          html += \`
            <div class="coral-levels">
              <div class="detail-label">Coral Levels:</div>
          \`;
          
          // Check if coralLevels exists and is an array
          if (Array.isArray(team.coralLevels) && team.coralLevels.length > 0) {
            team.coralLevels.forEach(level => {
              html += \`<span class="coral-level-tag">\${level}</span>\`;
            });
          } else {
            html += \`<span>None</span>\`;
          }
          
          html += \`
            </div>
            
            <div class="detail-item" style="margin-top: 15px;">
              <span class="detail-label">Notes:</span>
              <div>\${formatValue(team.notes)}</div>
            </div>
            
            <div class="detail-item" style="margin-top: 15px;">
              <span class="detail-label">Raw Data:</span>
              <pre>\${JSON.stringify(team, null, 2)}</pre>
            </div>
          </div>
          \`;
          
          teamContainer.innerHTML = html;
        }
        
        // Fetch team on page load
        document.addEventListener('DOMContentLoaded', fetchTeam);
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