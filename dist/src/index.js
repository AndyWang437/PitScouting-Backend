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
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/teams', teams_1.default);
// Root route
app.get('/', (_req, res) => {
    res.json({
        message: 'Scouting App API is running',
        environment: env,
        corsOrigin: process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app',
        uploadsDir: uploadsDir
    });
});
const startServer = async () => {
    try {
        await (0, init_2.initDb)();
        await init_1.sequelize.authenticate();
        console.log('Database connected successfully');
        console.log(`Uploads directory: ${uploadsDir}`);
        // Run database setup (migrations and create admin user)
        await (0, setup_1.setupDatabase)();
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
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
