import express = require('express');
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { sequelize } from './models';
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';

const app = express();
const port = process.env.PORT || 5001;
const env = process.env.NODE_ENV || 'development';

// Remove trailing slash from FRONTEND_URL if it exists
const corsOrigin = env === 'production' 
  ? (process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app').replace(/\/$/, '')
  : 'http://localhost:3000';

// CORS configuration
app.use(cors({
  origin: ['https://1334pitscouting.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/src/uploads'
  : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/storage', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Scouting App API is running',
    environment: env,
    corsOrigin
  });
});

// Database connection and server start
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${env}`);
      console.log(`CORS origin: ${corsOrigin}`);
      console.log('API endpoints:');
      console.log('- POST /api/auth/login');
      console.log('- POST /api/auth/register');
      console.log('- GET /api/teams');
      console.log('- POST /api/teams');
      console.log('- GET /api/teams/:teamNumber');
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

export default app; 