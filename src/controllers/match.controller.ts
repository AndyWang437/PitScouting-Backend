import express = require('express');
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import { Match } from '../models';
import { sequelize } from '../db/init';

// Define interfaces for database records
interface MatchRecord {
  id: number;
  matchNumber: number;
  teamNumber: number;
  autoScoreCoral: boolean;
  autoScoreAlgae: boolean;
  autoStartingPosition: string;
  teleopDealgifying: boolean;
  teleopPreference: string;
  scoringPreference: string;
  coralLevels: string[];
  endgameType: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to check if matches table exists
const checkMatchesTable = async (): Promise<boolean> => {
  try {
    const [tables] = await sequelize.query(
      sequelize.getDialect() === 'sqlite'
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name='matches'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches'"
    );
    return tables.length > 0;
  } catch (error) {
    console.error('Error checking matches table:', error);
    return false;
  }
};

export const createMatch = async (req: Request, res: Response): Promise<void> => {
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
    let coralLevels: string[] = [];
    try {
      if (typeof req.body.coralLevels === 'string') {
        if (req.body.coralLevels.trim() === '') {
          coralLevels = [];
          console.log('Empty coralLevels string, using empty array');
        } else {
          try {
            coralLevels = JSON.parse(req.body.coralLevels);
            console.log('Parsed coralLevels from string:', coralLevels);
          } catch (parseError) {
            console.error('Error parsing coralLevels JSON:', parseError);
            // If it's not valid JSON, treat it as a single item
            coralLevels = [req.body.coralLevels];
            console.log('Using coralLevels as single item:', coralLevels);
          }
        }
      } else if (Array.isArray(req.body.coralLevels)) {
        coralLevels = req.body.coralLevels;
        console.log('Using coralLevels array directly:', coralLevels);
      } else {
        console.log('No coralLevels provided, using empty array');
      }
    } catch (error) {
      console.error('Error handling coralLevels:', error, 'Value was:', req.body.coralLevels);
      coralLevels = [];
    }
    
    // Handle boolean values properly
    const parseBooleanField = (value: any) => {
      if (typeof value === 'boolean') return value;
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
        const existingMatch = await Match.findOne({ 
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
      } catch (sequelizeError) {
        console.error('Sequelize error finding match:', sequelizeError);
        // Continue with direct SQL approach
      }
      
      // Try direct SQL approach
      const isSqlite = sequelize.getDialect() === 'sqlite';
      const [existingMatches] = await sequelize.query(
        `SELECT * FROM matches WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber}`
      );
      
      if (existingMatches.length > 0) {
        const existingMatch = existingMatches[0] as MatchRecord;
        console.log('Match exists (SQL), updating:', existingMatch.id);
        
        // Build update query
        const updateFields = Object.entries(processedData)
          .map(([key, value]) => {
            if (value === null) {
              return `"${key}" = NULL`;
            } else if (Array.isArray(value)) {
              if (isSqlite) {
                return `"${key}" = '${JSON.stringify(value)}'`;
              } else {
                return `"${key}" = ARRAY[${value.map(v => `'${v}'`).join(',')}]::text[]`;
              }
            } else if (typeof value === 'string') {
              return `"${key}" = '${value.replace(/'/g, "''")}'`;
            } else if (typeof value === 'boolean') {
              return `"${key}" = ${isSqlite ? (value ? 1 : 0) : value}`;
            } else {
              return `"${key}" = ${value}`;
            }
          })
          .join(', ');
        
        const updateQuery = isSqlite
          ? `
            UPDATE matches 
            SET ${updateFields}, "updatedAt" = CURRENT_TIMESTAMP 
            WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber} 
            RETURNING *
          `
          : `
            UPDATE matches 
            SET ${updateFields}, "updatedAt" = NOW() 
            WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber} 
            RETURNING *
          `;
        
        const [updatedMatches] = await sequelize.query(updateQuery);
        console.log('Match updated successfully (SQL):', updatedMatches[0]);
        res.status(200).json(updatedMatches[0]);
      } else {
        console.log('Match does not exist, creating new match');
        
        // Build insert query
        const keys = Object.keys(processedData).map(k => `"${k}"`).join(', ');
        const values = Object.entries(processedData).map(([_, value]) => {
          if (value === null) {
            return 'NULL';
          } else if (Array.isArray(value)) {
            if (isSqlite) {
              return `'${JSON.stringify(value)}'`;
            } else {
              return `ARRAY[${value.map(v => `'${v}'`).join(',')}]::text[]`;
            }
          } else if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
          } else if (typeof value === 'boolean') {
            return isSqlite ? (value ? 1 : 0) : value;
          } else {
            return value;
          }
        }).join(', ');
        
        const insertQuery = isSqlite
          ? `
            INSERT INTO matches (${keys}, "createdAt", "updatedAt") 
            VALUES (${values}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
            RETURNING *
          `
          : `
            INSERT INTO matches (${keys}, "createdAt", "updatedAt") 
            VALUES (${values}, NOW(), NOW()) 
            RETURNING *
          `;
        
        const [newMatches] = await sequelize.query(insertQuery);
        console.log('Match created successfully (SQL):', newMatches[0]);
        res.status(201).json(newMatches[0]);
      }
    } catch (sqlError) {
      console.error('SQL error creating/updating match:', sqlError);
      throw sqlError;
    }
  } catch (error: any) {
    console.error('Error creating match:', error);
    console.error('Error details:', error.original || error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      error: 'Error creating match', 
      message: error.message,
      details: error.original?.detail || error.original?.message || error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const matchNumber = parseInt(req.params.matchNumber);
    const teamNumber = parseInt(req.params.teamNumber);
    
    if (isNaN(matchNumber) || isNaN(teamNumber)) {
      res.status(400).json({ error: 'Invalid match or team number' });
      return;
    }

    // Try direct SQL approach
    try {
      const isSqlite = sequelize.getDialect() === 'sqlite';
      const [matches] = await sequelize.query(
        `SELECT * FROM matches WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber}`
      );
      
      if (matches.length === 0) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }
      
      const match = matches[0] as MatchRecord;
      
      // Parse coralLevels if it's a string (SQLite)
      if (isSqlite && typeof match.coralLevels === 'string') {
        try {
          match.coralLevels = JSON.parse(match.coralLevels as unknown as string);
          console.log('Parsed coralLevels from SQLite:', match.coralLevels);
        } catch (parseError) {
          console.error('Error parsing coralLevels from SQLite:', parseError);
          match.coralLevels = [];
        }
      }
      
      res.json(match);
    } catch (sqlError) {
      console.error('SQL error fetching match:', sqlError);
      
      // Fall back to Sequelize
      const match = await Match.findOne({
        where: { 
          matchNumber,
          teamNumber
        },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      res.json(match);
    }
  } catch (error: any) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Error fetching match', details: error.message });
  }
};

export const getAllMatches = async (req: Request, res: Response): Promise<void> => {
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
      const [matches] = await sequelize.query(query);
      console.log(`Found ${matches.length} matches`);
      
      // Process each match for SQLite array handling
      const isSqlite = sequelize.getDialect() === 'sqlite';
      for (const match of matches) {
        const matchRecord = match as MatchRecord;
        
        // Parse coralLevels if it's a string (SQLite)
        if (isSqlite && typeof matchRecord.coralLevels === 'string') {
          try {
            matchRecord.coralLevels = JSON.parse(matchRecord.coralLevels as unknown as string);
            console.log(`Parsed coralLevels for match ${matchRecord.matchNumber}, team ${matchRecord.teamNumber}:`, matchRecord.coralLevels);
          } catch (parseError) {
            console.error(`Error parsing coralLevels for match ${matchRecord.matchNumber}, team ${matchRecord.teamNumber}:`, parseError);
            matchRecord.coralLevels = [];
          }
        }
      }
      
      res.json(matches);
    } catch (sqlError) {
      console.error('SQL error fetching matches:', sqlError);
      throw sqlError;
    }
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    console.error('Error details:', error.original || error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      error: 'Error fetching matches', 
      message: error.message,
      details: error.original?.detail || error.original?.message || error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 