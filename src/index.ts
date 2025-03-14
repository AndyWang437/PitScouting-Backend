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
  origin: process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app',
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
    corsOrigin: process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app',
    uploadsDir: uploadsDir,
    databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set'
  });
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env
  });
});

// Database status route
app.get('/db-status', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    
    // Check if tables exist
    const dialect = sequelize.getDialect();
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    // Check if teams table exists and has the right structure
    let teamsTableInfo = [];
    if (tables.includes('teams')) {
      const [columns] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teams'");
      teamsTableInfo = columns;
    }
    
    // Check if matches table exists and has the right structure
    let matchesTableInfo = [];
    if (tables.includes('matches')) {
      const [columns] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'matches'");
      matchesTableInfo = columns;
    }
    
    // Check if users table exists and has the right structure
    let usersTableInfo = [];
    if (tables.includes('users')) {
      const [columns] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
      usersTableInfo = columns;
    }
    
    // Check if admin user exists
    let adminUserExists = false;
    if (tables.includes('users')) {
      const [users] = await sequelize.query("SELECT * FROM users WHERE email = '1334admin@gmail.com'");
      adminUserExists = users.length > 0;
    }
    
    res.json({ 
      status: 'connected',
      dialect: dialect,
      tables: tables,
      teamsTableInfo,
      matchesTableInfo,
      usersTableInfo,
      adminUserExists,
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      dialect: sequelize.getDialect(),
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set'
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