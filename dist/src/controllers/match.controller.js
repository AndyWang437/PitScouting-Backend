"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMatches = exports.createMatch = void 0;
const models_1 = require("../models");
const init_1 = require("../db/init");
// Helper function to check if matches table exists
const checkMatchesTable = async () => {
    try {
        const [tables] = await init_1.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches'");
        return tables.length > 0;
    }
    catch (error) {
        console.error('Error checking matches table:', error);
        return false;
    }
};
const createMatch = async (req, res) => {
    var _a, _b;
    try {
        console.log('Received match data:', JSON.stringify(req.body, null, 2));
        // Check if matches table exists
        const tableExists = await checkMatchesTable();
        if (!tableExists) {
            console.error('Matches table does not exist');
            res.status(500).json({
                error: 'Database error',
                message: 'Matches table does not exist',
                details: 'Please contact the administrator to set up the database'
            });
            return;
        }
        // Validate required fields
        if (!req.body.matchNumber || !req.body.teamNumber) {
            console.error('Match number or team number is missing in request');
            throw new Error('Match number and team number are required');
        }
        // Parse and validate numeric values
        const matchNumber = parseInt(req.body.matchNumber);
        const teamNumber = parseInt(req.body.teamNumber);
        if (isNaN(matchNumber) || isNaN(teamNumber)) {
            console.error('Invalid match or team number format:', req.body.matchNumber, req.body.teamNumber);
            throw new Error('Invalid match or team number format');
        }
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
        const processedData = {
            matchNumber,
            teamNumber,
            autoScoreCoral: parseBooleanField(req.body.autoScoreCoral),
            autoScoreAlgae: parseBooleanField(req.body.autoScoreAlgae),
            autoStartingPosition: req.body.autoStartingPosition || null,
            teleopDealgifying: parseBooleanField(req.body.teleopDealgifying),
            teleopPreference: req.body.teleopPreference || null,
            scoringPreference: req.body.scoringPreference || null,
            coralLevels,
            endgameType: req.body.endgameType || 'none',
            notes: req.body.notes || '',
        };
        console.log('Processed match data:', JSON.stringify(processedData, null, 2));
        // Try direct SQL approach if Sequelize fails
        try {
            // Check if match already exists
            console.log('Checking if match already exists with match number and team number:', matchNumber, teamNumber);
            // First try with Sequelize
            try {
                const existingMatch = await models_1.Match.findOne({
                    where: {
                        matchNumber,
                        teamNumber
                    }
                });
                if (existingMatch) {
                    console.log('Match exists, updating:', existingMatch.id);
                    // Update existing match
                    await existingMatch.update(processedData);
                    console.log('Match updated successfully:', existingMatch.toJSON());
                    res.status(200).json(existingMatch);
                    return;
                }
            }
            catch (sequelizeError) {
                console.error('Sequelize error finding match:', sequelizeError);
                // Continue with direct SQL approach
            }
            // Try direct SQL approach
            const [existingMatches] = await init_1.sequelize.query(`SELECT * FROM matches WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber}`);
            if (existingMatches.length > 0) {
                const existingMatch = existingMatches[0];
                console.log('Match exists (SQL), updating:', existingMatch.id);
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
          UPDATE matches 
          SET ${updateFields}, "updatedAt" = NOW() 
          WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber} 
          RETURNING *
        `;
                const [updatedMatches] = await init_1.sequelize.query(updateQuery);
                console.log('Match updated successfully (SQL):', updatedMatches[0]);
                res.status(200).json(updatedMatches[0]);
            }
            else {
                console.log('Match does not exist, creating new match');
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
          INSERT INTO matches (${keys}, "createdAt", "updatedAt") 
          VALUES (${values}, NOW(), NOW()) 
          RETURNING *
        `;
                const [newMatches] = await init_1.sequelize.query(insertQuery);
                console.log('Match created successfully (SQL):', newMatches[0]);
                res.status(201).json(newMatches[0]);
            }
        }
        catch (sqlError) {
            console.error('SQL error creating/updating match:', sqlError);
            throw sqlError;
        }
    }
    catch (error) {
        console.error('Error creating match:', error);
        console.error('Error details:', error.original || error);
        console.error('Error stack:', error.stack);
        res.status(400).json({
            error: 'Error creating match',
            message: error.message,
            details: ((_a = error.original) === null || _a === void 0 ? void 0 : _a.detail) || ((_b = error.original) === null || _b === void 0 ? void 0 : _b.message) || error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
exports.createMatch = createMatch;
const getAllMatches = async (req, res) => {
    var _a, _b;
    try {
        console.log('Fetching all matches with query params:', req.query);
        // Check if matches table exists
        const tableExists = await checkMatchesTable();
        if (!tableExists) {
            console.error('Matches table does not exist');
            res.status(500).json({
                error: 'Database error',
                message: 'Matches table does not exist',
                details: 'Please contact the administrator to set up the database'
            });
            return;
        }
        // Try direct SQL approach
        try {
            let query = 'SELECT * FROM matches';
            const whereConditions = [];
            // Handle search filters
            if (req.query.search) {
                whereConditions.push(`("teamNumber"::text LIKE '%${req.query.search}%' OR "matchNumber"::text LIKE '%${req.query.search}%')`);
            }
            if (req.query.teamNumber) {
                whereConditions.push(`"teamNumber" = ${req.query.teamNumber}`);
            }
            if (req.query.matchNumber) {
                whereConditions.push(`"matchNumber" = ${req.query.matchNumber}`);
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
            // Add order by
            query += ' ORDER BY "matchNumber" ASC, "teamNumber" ASC';
            console.log('SQL Query:', query);
            const [matches] = await init_1.sequelize.query(query);
            console.log(`Found ${matches.length} matches`);
            res.json(matches);
        }
        catch (sqlError) {
            console.error('SQL error fetching matches:', sqlError);
            throw sqlError;
        }
    }
    catch (error) {
        console.error('Error fetching matches:', error);
        console.error('Error details:', error.original || error);
        console.error('Error stack:', error.stack);
        res.status(400).json({
            error: 'Error fetching matches',
            message: error.message,
            details: ((_a = error.original) === null || _a === void 0 ? void 0 : _a.detail) || ((_b = error.original) === null || _b === void 0 ? void 0 : _b.message) || error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
exports.getAllMatches = getAllMatches;
