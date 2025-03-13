"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTeams = exports.updateTeam = exports.getTeam = exports.createTeam = void 0;
const models_1 = require("../models");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const init_1 = require("../db/init");
// Helper function to check if teams table exists
const checkTeamsTable = async () => {
    try {
        const [tables] = await init_1.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams'");
        return tables.length > 0;
    }
    catch (error) {
        console.error('Error checking teams table:', error);
        return false;
    }
};
const createTeam = async (req, res) => {
    var _a, _b;
    try {
        console.log('Received team data:', JSON.stringify(req.body, null, 2));
        console.log('File:', req.file);
        // Check if teams table exists
        const tableExists = await checkTeamsTable();
        if (!tableExists) {
            console.error('Teams table does not exist');
            res.status(500).json({
                error: 'Database error',
                message: 'Teams table does not exist',
                details: 'Please contact the administrator to set up the database'
            });
            return;
        }
        // Validate teamNumber
        if (!req.body.teamNumber) {
            console.error('Team number is missing in request');
            throw new Error('Team number is required');
        }
        // Parse and validate numeric values first
        const teamNumber = parseInt(req.body.teamNumber);
        const robotWidth = req.body.robotWidth ? parseFloat(req.body.robotWidth) : null;
        const robotLength = req.body.robotLength ? parseFloat(req.body.robotLength) : null;
        const robotHeight = req.body.robotHeight ? parseFloat(req.body.robotHeight) : null;
        const robotWeight = req.body.robotWeight ? parseFloat(req.body.robotWeight) : null;
        if (isNaN(teamNumber)) {
            console.error('Invalid team number format:', req.body.teamNumber);
            throw new Error('Invalid team number format');
        }
        // Validate numeric values
        [robotWidth, robotLength, robotHeight, robotWeight].forEach((value, index) => {
            if (value !== null && isNaN(value)) {
                console.error(`Invalid numeric value for ${['width', 'length', 'height', 'weight'][index]}:`, value);
                throw new Error(`Invalid numeric value for ${['width', 'length', 'height', 'weight'][index]}`);
            }
        });
        // Handle coralLevels
        let coralLevels = [];
        try {
            if (typeof req.body.coralLevels === 'string') {
                if (req.body.coralLevels.trim() === '') {
                    coralLevels = [];
                    console.log('Empty coralLevels string, using empty array');
                }
                else {
                    try {
                        coralLevels = JSON.parse(req.body.coralLevels);
                        console.log('Parsed coralLevels from string:', coralLevels);
                    }
                    catch (parseError) {
                        console.error('Error parsing coralLevels JSON:', parseError);
                        // If it's not valid JSON, treat it as a single item
                        coralLevels = [req.body.coralLevels];
                        console.log('Using coralLevels as single item:', coralLevels);
                    }
                }
            }
            else if (Array.isArray(req.body.coralLevels)) {
                coralLevels = req.body.coralLevels;
                console.log('Using coralLevels array directly:', coralLevels);
            }
            else {
                console.log('No coralLevels provided, using empty array');
            }
        }
        catch (error) {
            console.error('Error handling coralLevels:', error, 'Value was:', req.body.coralLevels);
            coralLevels = [];
        }
        // Handle boolean values properly
        const parseBooleanField = (value) => {
            if (typeof value === 'boolean')
                return value;
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true';
            }
            return false;
        };
        // Properly handle the image URL
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
            console.log('Image URL set to:', imageUrl);
        }
        else {
            console.log('No image file uploaded');
        }
        const processedData = {
            teamNumber,
            autoScoreCoral: parseBooleanField(req.body.autoScoreCoral),
            autoScoreAlgae: parseBooleanField(req.body.autoScoreAlgae),
            mustStartSpecificPosition: parseBooleanField(req.body.mustStartSpecificPosition),
            autoStartingPosition: req.body.autoStartingPosition || null,
            teleopDealgifying: parseBooleanField(req.body.teleopDealgifying),
            teleopPreference: req.body.teleopPreference || null,
            scoringPreference: req.body.scoringPreference || null,
            coralLevels,
            endgameType: req.body.endgameType || 'none',
            robotWidth,
            robotLength,
            robotHeight,
            robotWeight,
            drivetrainType: req.body.drivetrainType || null,
            notes: req.body.notes || '',
            imageUrl,
        };
        console.log('Processed team data:', JSON.stringify(processedData, null, 2));
        // Try direct SQL approach if Sequelize fails
        try {
            // Check if team already exists
            console.log('Checking if team already exists with number:', teamNumber);
            // First try with Sequelize
            try {
                const existingTeam = await models_1.Team.findOne({ where: { teamNumber } });
                if (existingTeam) {
                    console.log('Team exists, updating:', existingTeam.id);
                    // Update existing team
                    await existingTeam.update(processedData);
                    console.log('Team updated successfully:', existingTeam.toJSON());
                    res.status(200).json(existingTeam);
                    return;
                }
            }
            catch (sequelizeError) {
                console.error('Sequelize error finding team:', sequelizeError);
                // Continue with direct SQL approach
            }
            // Try direct SQL approach
            const [existingTeams] = await init_1.sequelize.query(`SELECT * FROM teams WHERE "teamNumber" = ${teamNumber}`);
            if (existingTeams.length > 0) {
                const existingTeam = existingTeams[0];
                console.log('Team exists (SQL), updating:', existingTeam.id);
                // Build update query
                const updateFields = Object.entries(processedData)
                    .map(([key, value]) => {
                    if (value === null) {
                        return `"${key}" = NULL`;
                    }
                    else if (Array.isArray(value)) {
                        return `"${key}" = ARRAY[${value.map(v => `'${v}'`).join(',')}]::text[]`;
                    }
                    else if (typeof value === 'string') {
                        return `"${key}" = '${value.replace(/'/g, "''")}'`;
                    }
                    else if (typeof value === 'boolean') {
                        return `"${key}" = ${value}`;
                    }
                    else {
                        return `"${key}" = ${value}`;
                    }
                })
                    .join(', ');
                const updateQuery = `
          UPDATE teams 
          SET ${updateFields}, "updatedAt" = NOW() 
          WHERE "teamNumber" = ${teamNumber} 
          RETURNING *
        `;
                const [updatedTeams] = await init_1.sequelize.query(updateQuery);
                console.log('Team updated successfully (SQL):', updatedTeams[0]);
                res.status(200).json(updatedTeams[0]);
            }
            else {
                console.log('Team does not exist, creating new team');
                // Build insert query
                const keys = Object.keys(processedData).map(k => `"${k}"`).join(', ');
                const values = Object.entries(processedData).map(([_, value]) => {
                    if (value === null) {
                        return 'NULL';
                    }
                    else if (Array.isArray(value)) {
                        return `ARRAY[${value.map(v => `'${v}'`).join(',')}]::text[]`;
                    }
                    else if (typeof value === 'string') {
                        return `'${value.replace(/'/g, "''")}'`;
                    }
                    else if (typeof value === 'boolean') {
                        return value;
                    }
                    else {
                        return value;
                    }
                }).join(', ');
                const insertQuery = `
          INSERT INTO teams (${keys}, "createdAt", "updatedAt") 
          VALUES (${values}, NOW(), NOW()) 
          RETURNING *
        `;
                const [newTeams] = await init_1.sequelize.query(insertQuery);
                console.log('Team created successfully (SQL):', newTeams[0]);
                res.status(201).json(newTeams[0]);
            }
        }
        catch (sqlError) {
            console.error('SQL error creating/updating team:', sqlError);
            throw sqlError;
        }
    }
    catch (error) {
        console.error('Error creating team:', error);
        console.error('Error details:', error.original || error);
        console.error('Error stack:', error.stack);
        res.status(400).json({
            error: 'Error creating team',
            message: error.message,
            details: ((_a = error.original) === null || _a === void 0 ? void 0 : _a.detail) || ((_b = error.original) === null || _b === void 0 ? void 0 : _b.message) || error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
exports.createTeam = createTeam;
const getTeam = async (req, res) => {
    try {
        const teamNumber = parseInt(req.params.teamNumber);
        if (isNaN(teamNumber)) {
            res.status(400).json({ error: 'Invalid team number' });
            return;
        }
        const team = await models_1.Team.findOne({
            where: { teamNumber },
        });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        // Verify image exists if imageUrl is set
        if (team.imageUrl) {
            const filename = path_1.default.basename(team.imageUrl);
            const uploadsDir = process.env.NODE_ENV === 'production'
                ? '/opt/render/project/src/uploads'
                : path_1.default.join(__dirname, '../../uploads');
            const filePath = path_1.default.join(uploadsDir, filename);
            if (!fs_1.default.existsSync(filePath)) {
                console.warn(`Image file not found: ${filePath}`);
                team.imageUrl = null;
            }
        }
        res.json(team);
    }
    catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Error fetching team', details: error.message });
    }
};
exports.getTeam = getTeam;
const updateTeam = async (req, res) => {
    try {
        const teamNumber = parseInt(req.params.teamNumber);
        if (isNaN(teamNumber)) {
            res.status(400).json({ error: 'Invalid team number' });
            return;
        }
        const team = await models_1.Team.findOne({
            where: { teamNumber },
        });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        // Handle image upload if present
        let updateData = { ...req.body };
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
            // Remove old image if it exists
            if (team.imageUrl) {
                const oldFilename = path_1.default.basename(team.imageUrl);
                const uploadsDir = process.env.NODE_ENV === 'production'
                    ? '/opt/render/project/src/uploads'
                    : path_1.default.join(__dirname, '../../uploads');
                const oldFilePath = path_1.default.join(uploadsDir, oldFilename);
                if (fs_1.default.existsSync(oldFilePath)) {
                    try {
                        fs_1.default.unlinkSync(oldFilePath);
                        console.log(`Deleted old image: ${oldFilePath}`);
                    }
                    catch (err) {
                        console.error(`Failed to delete old image: ${oldFilePath}`, err);
                    }
                }
            }
        }
        await team.update(updateData);
        res.json(team);
    }
    catch (error) {
        console.error('Error updating team:', error);
        res.status(400).json({ error: 'Error updating team', details: error.message });
    }
};
exports.updateTeam = updateTeam;
const getAllTeams = async (req, res) => {
    var _a, _b;
    try {
        console.log('Fetching all teams with query params:', req.query);
        // Check if teams table exists
        const tableExists = await checkTeamsTable();
        if (!tableExists) {
            console.error('Teams table does not exist');
            res.status(500).json({
                error: 'Database error',
                message: 'Teams table does not exist',
                details: 'Please contact the administrator to set up the database'
            });
            return;
        }
        // Try direct SQL approach
        try {
            let query = 'SELECT * FROM teams';
            const whereConditions = [];
            // Handle search filters
            if (req.query.search) {
                whereConditions.push(`"teamNumber"::text LIKE '%${req.query.search}%'`);
            }
            if (req.query.drivetrain) {
                whereConditions.push(`"drivetrainType" ILIKE '%${req.query.drivetrain}%'`);
            }
            if (req.query.endgameType) {
                whereConditions.push(`"endgameType" = '${req.query.endgameType}'`);
            }
            if (req.query.autoPosition) {
                whereConditions.push(`"autoStartingPosition" = '${req.query.autoPosition}'`);
            }
            if (req.query.teleopPreference) {
                whereConditions.push(`"teleopPreference" = '${req.query.teleopPreference}'`);
            }
            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
            }
            console.log('SQL Query:', query);
            const [teams] = await init_1.sequelize.query(query);
            console.log(`Found ${teams.length} teams`);
            // Verify all image URLs
            for (const team of teams) {
                const teamRecord = team;
                if (teamRecord.imageUrl) {
                    const filename = path_1.default.basename(teamRecord.imageUrl);
                    const uploadsDir = process.env.NODE_ENV === 'production'
                        ? '/opt/render/project/src/uploads'
                        : path_1.default.join(__dirname, '../../uploads');
                    const filePath = path_1.default.join(uploadsDir, filename);
                    if (!fs_1.default.existsSync(filePath)) {
                        console.warn(`Image file not found: ${filePath}`);
                        teamRecord.imageUrl = null;
                    }
                }
            }
            res.json(teams);
        }
        catch (sqlError) {
            console.error('SQL error fetching teams:', sqlError);
            throw sqlError;
        }
    }
    catch (error) {
        console.error('Error fetching teams:', error);
        console.error('Error details:', error.original || error);
        console.error('Error stack:', error.stack);
        res.status(400).json({
            error: 'Error fetching teams',
            message: error.message,
            details: ((_a = error.original) === null || _a === void 0 ? void 0 : _a.detail) || ((_b = error.original) === null || _b === void 0 ? void 0 : _b.message) || error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
exports.getAllTeams = getAllTeams;
