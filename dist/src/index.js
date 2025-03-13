"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const init_1 = require("./db/init");
const auth_1 = __importDefault(require("./routes/auth"));
const teams_1 = __importDefault(require("./routes/teams"));
const matches_1 = __importDefault(require("./routes/matches"));
const init_2 = require("./db/init");
const setup_1 = require("./db/setup");
const app = express();
const port = parseInt(process.env.PORT || '10000', 10);
const env = process.env.NODE_ENV || 'development';
// Update CORS configuration to only allow your deployed frontend
app.use((0, cors_1.default)({
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
    : path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory at: ${uploadsDir}`);
}
// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));
// Add a route to check if an image exists
app.get('/check-image/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path_1.default.join(uploadsDir, filename);
    if (fs_1.default.existsSync(filePath)) {
        res.json({ exists: true, path: `/uploads/${filename}` });
    }
    else {
        res.json({ exists: false });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
// Root route
app.get('/', (_req, res) => {
    res.json({
        message: 'Scouting App API is running',
        environment: env,
        corsOrigin: process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app',
        uploadsDir: uploadsDir,
        databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set'
    });
});
// Health check route
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env
    });
});
// Database status route
app.get('/db-status', async (_req, res) => {
    try {
        await init_1.sequelize.authenticate();
        // Check if tables exist
        const [tables] = await init_1.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tableNames = tables.map((t) => t.table_name);
        // Check if teams table exists and has the right structure
        let teamsTableInfo = [];
        if (tableNames.includes('teams')) {
            const [columns] = await init_1.sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teams'");
            teamsTableInfo = columns;
        }
        // Check if matches table exists and has the right structure
        let matchesTableInfo = [];
        if (tableNames.includes('matches')) {
            const [columns] = await init_1.sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'matches'");
            matchesTableInfo = columns;
        }
        // Check if users table exists and has the right structure
        let usersTableInfo = [];
        if (tableNames.includes('users')) {
            const [columns] = await init_1.sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
            usersTableInfo = columns;
        }
        // Check if admin user exists
        let adminUserExists = false;
        if (tableNames.includes('users')) {
            const [users] = await init_1.sequelize.query("SELECT * FROM users WHERE email = '1334admin@gmail.com'");
            adminUserExists = users.length > 0;
        }
        res.json({
            status: 'connected',
            tables: tableNames,
            teamsTableInfo,
            matchesTableInfo,
            usersTableInfo,
            adminUserExists,
            timestamp: new Date().toISOString(),
            databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set'
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set'
        });
    }
});
// Setup database and run migrations route
app.post('/setup-database', async (_req, res) => {
    try {
        console.log('Manually triggering database setup...');
        await (0, setup_1.setupDatabase)();
        res.json({
            status: 'success',
            message: 'Database setup completed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error setting up database:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/teams', teams_1.default);
app.use('/api/matches', matches_1.default);
const startServer = async () => {
    try {
        console.log('Initializing database...');
        await (0, init_2.initDb)();
        console.log('Database initialized successfully');
        console.log('Setting up database (creating tables and admin user)...');
        await (0, setup_1.setupDatabase)();
        console.log('Database setup completed successfully');
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
    }
    catch (error) {
        console.error('Failed to start server:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        process.exit(1);
    }
};
startServer();
exports.default = app;
