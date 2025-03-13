"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTeams = exports.updateTeam = exports.getTeam = exports.createTeam = void 0;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createTeam = async (req, res) => {
    var _a, _b;
    try {
        console.log('Received team data:', JSON.stringify(req.body, null, 2));
        console.log('File:', req.file);
        // Validate teamNumber
        if (!req.body.teamNumber) {
            throw new Error('Team number is required');
        }
        // Parse and validate numeric values first
        const teamNumber = parseInt(req.body.teamNumber);
        const robotWidth = req.body.robotWidth ? parseFloat(req.body.robotWidth) : null;
        const robotLength = req.body.robotLength ? parseFloat(req.body.robotLength) : null;
        const robotHeight = req.body.robotHeight ? parseFloat(req.body.robotHeight) : null;
        const robotWeight = req.body.robotWeight ? parseFloat(req.body.robotWeight) : null;
        if (isNaN(teamNumber)) {
            throw new Error('Invalid team number format');
        }
        // Validate numeric values
        [robotWidth, robotLength, robotHeight, robotWeight].forEach((value, index) => {
            if (value !== null && isNaN(value)) {
                throw new Error(`Invalid numeric value for ${['width', 'length', 'height', 'weight'][index]}`);
            }
        });
        let coralLevels = [];
        try {
            if (typeof req.body.coralLevels === 'string') {
                coralLevels = JSON.parse(req.body.coralLevels);
            }
            else if (Array.isArray(req.body.coralLevels)) {
                coralLevels = req.body.coralLevels;
            }
        }
        catch (error) {
            console.error('Error parsing coralLevels:', error);
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
        // Check if team already exists
        const existingTeam = await models_1.Team.findOne({ where: { teamNumber } });
        if (existingTeam) {
            // Update existing team
            await existingTeam.update(processedData);
            console.log('Team updated successfully:', existingTeam.toJSON());
            res.status(200).json(existingTeam);
        }
        else {
            // Create new team
            try {
                const team = await models_1.Team.create(processedData);
                console.log('Team created successfully:', team.toJSON());
                res.status(201).json(team);
            }
            catch (dbError) {
                console.error('Database error:', dbError);
                if (dbError.sql) {
                    console.error('SQL Query:', dbError.sql);
                }
                if (dbError.parameters) {
                    console.error('SQL Parameters:', dbError.parameters);
                }
                throw dbError;
            }
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
    try {
        const { search, drivetrain, endgameType, autoPosition, teleopPreference } = req.query;
        const where = {};
        if (search) {
            where.teamNumber = { [sequelize_1.Op.like]: `%${search}%` };
        }
        if (drivetrain) {
            where.drivetrainType = { [sequelize_1.Op.iLike]: `%${drivetrain}%` };
        }
        if (endgameType) {
            where.endgameType = endgameType;
        }
        if (autoPosition) {
            where.autoStartingPosition = autoPosition;
        }
        if (teleopPreference) {
            where.teleopPreference = teleopPreference;
        }
        const teams = await models_1.Team.findAll({ where });
        // Verify all image URLs
        for (const team of teams) {
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
        }
        res.json(teams);
    }
    catch (error) {
        console.error('Error fetching teams:', error);
        res.status(400).json({ error: 'Error fetching teams', details: error.message });
    }
};
exports.getAllTeams = getAllTeams;
