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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Scouting App API is running',
    environment: env,
    corsOrigin: process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app',
    uploadsDir: uploadsDir
  });
});

const startServer = async () => {
  try {
    await initDb();
    await sequelize.authenticate();
    console.log('Database connected successfully');
    console.log(`Uploads directory: ${uploadsDir}`);
    
    // Run database setup (migrations and create admin user)
    await setupDatabase();
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${env}`);
      console.log('API endpoints:');
      console.log('- POST /api/auth/login');
      console.log('- POST /api/auth/register');
      console.log('- GET /api/teams');
      console.log('- POST /api/teams');
      console.log('- GET /api/teams/:teamNumber');
      console.log('- GET /uploads/:filename (for images)');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 