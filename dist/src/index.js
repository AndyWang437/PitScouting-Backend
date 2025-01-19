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
const app = express();
const port = process.env.PORT || 5001;
const env = process.env.NODE_ENV || 'development';
// Remove trailing slash from FRONTEND_URL if it exists
const corsOrigin = env === 'production'
    ? (process.env.FRONTEND_URL || 'https://1334pitscouting.vercel.app').replace(/\/$/, '')
    : 'http://localhost:3000';
// CORS configuration
app.use((0, cors_1.default)({
    origin: ['https://1334pitscouting.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());
// Ensure uploads directory exists
const uploadsDir = process.env.NODE_ENV === 'production'
    ? '/opt/render/project/src/uploads'
    : path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Serve static files from the uploads directory
app.use('/storage', express.static(uploadsDir));
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/teams', teams_1.default);
// Root route
app.get('/', (_req, res) => {
    res.json({
        message: 'Scouting App API is running',
        environment: env,
        corsOrigin
    });
});
const startServer = async () => {
    try {
        // Initialize database
        await (0, init_2.initDb)();
        // Your existing server setup code
        await init_1.sequelize.authenticate();
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
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
