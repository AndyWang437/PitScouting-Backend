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

// Add this function at the top of the file, after imports
const checkMatchesTable = async (): Promise<boolean> => {
  try {
    const dialect = sequelize.getDialect();
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name='matches'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches'"
    );
    
    const tableExists = tables.length > 0;
    console.log('Matches table exists:', tableExists);
    
    if (!tableExists) {
      // If table doesn't exist, try to create it
      console.log('Matches table does not exist, attempting to create it...');
      try {
        if (dialect === 'postgres') {
          await sequelize.query(`
            CREATE TABLE IF NOT EXISTS matches (
              id SERIAL PRIMARY KEY,
              "matchNumber" INTEGER NOT NULL,
              "teamNumber" INTEGER NOT NULL,
              "autoScoreCoral" BOOLEAN DEFAULT false,
              "autoScoreAlgae" BOOLEAN DEFAULT false,
              "autoStartingPosition" TEXT,
              "teleopDealgifying" BOOLEAN DEFAULT false,
              "teleopPreference" TEXT,
              "scoringPreference" TEXT,
              "coralLevels" TEXT DEFAULT '[]',
              "endgameType" TEXT DEFAULT 'none',
              "notes" TEXT DEFAULT '',
              "createdAt" TIMESTAMP DEFAULT NOW(),
              "updatedAt" TIMESTAMP DEFAULT NOW(),
              UNIQUE("matchNumber", "teamNumber")
            )
          `);
        } else {
          await sequelize.query(`
            CREATE TABLE IF NOT EXISTS matches (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              "matchNumber" INTEGER NOT NULL,
              "teamNumber" INTEGER NOT NULL,
              "autoScoreCoral" BOOLEAN DEFAULT 0,
              "autoScoreAlgae" BOOLEAN DEFAULT 0,
              "autoStartingPosition" TEXT,
              "teleopDealgifying" BOOLEAN DEFAULT 0,
              "teleopPreference" TEXT,
              "scoringPreference" TEXT,
              "coralLevels" TEXT DEFAULT '[]',
              "endgameType" TEXT DEFAULT 'none',
              "notes" TEXT DEFAULT '',
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UNIQUE("matchNumber", "teamNumber")
            )
          `);
        }
        console.log('Matches table created successfully');
        return true;
      } catch (createError) {
        console.error('Error creating matches table:', createError);
        return false;
      }
    }
    
    return tableExists;
  } catch (error) {
    console.error('Error checking if matches table exists:', error);
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
      
      if (existingMatches && existingMatches.length > 0) {
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
                if (value.length === 0) {
                  return `"${key}" = '{}'::text[]`;
                }
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
        if (updatedMatches && updatedMatches.length > 0) {
          console.log('Match updated successfully (SQL):', updatedMatches[0]);
          res.status(200).json(updatedMatches[0]);
        } else {
          console.error('Match update failed, no data returned');
          res.status(500).json({ 
            error: 'Error updating match', 
            message: 'Match update failed',
            details: 'Database operation succeeded but returned no data'
          });
        }
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
              if (value.length === 0) {
                return `'{}'::text[]`;
              }
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
        
        console.log('Insert query:', insertQuery);
        
        try {
          const [newMatches] = await sequelize.query(insertQuery);
          
          // Check if newMatches is defined and has elements
          if (newMatches && Array.isArray(newMatches) && newMatches.length > 0) {
            console.log('Match created successfully (SQL):', newMatches[0]);
            res.status(201).json(newMatches[0]);
          } else {
            console.log('Match created but no data returned from SQL query');
            
            // Try to create the match using Sequelize ORM
            try {
              console.log('Trying to create match using Sequelize ORM');
              const newMatch = await Match.create({
                ...processedData,
                coralLevels: JSON.stringify(coralLevels)
              });
              console.log('Match created successfully with Sequelize:', newMatch.toJSON());
              res.status(201).json(newMatch);
              return;
            } catch (ormError) {
              console.error('Error creating match with Sequelize:', ormError);
              
              // Fetch the match we just created
              try {
                const [createdMatches] = await sequelize.query(
                  `SELECT * FROM matches WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber}`
                );
                
                if (createdMatches && Array.isArray(createdMatches) && createdMatches.length > 0) {
                  console.log('Retrieved created match:', createdMatches[0]);
                  res.status(201).json(createdMatches[0]);
                } else {
                  console.error('Failed to retrieve created match');
                  res.status(500).json({ 
                    error: 'Error creating match', 
                    message: 'Match was created but could not be retrieved',
                    details: 'Database operation succeeded but returned no data'
                  });
                }
              } catch (fetchError) {
                console.error('Error fetching created match:', fetchError);
                res.status(500).json({ 
                  error: 'Error creating match', 
                  message: 'Match may have been created but could not be retrieved',
                  details: fetchError.message
                });
              }
            }
          }
        } catch (insertError) {
          console.error('Error executing insert query:', insertError);
          
          // Try to create the match using Sequelize ORM as a fallback
          try {
            console.log('Trying to create match using Sequelize ORM after SQL error');
            const newMatch = await Match.create({
              ...processedData,
              coralLevels: JSON.stringify(coralLevels)
            });
            console.log('Match created successfully with Sequelize after SQL error:', newMatch.toJSON());
            res.status(201).json(newMatch);
          } catch (ormError) {
            console.error('Error creating match with Sequelize after SQL error:', ormError);
            throw insertError; // Re-throw the original error
          }
        }
      }
    } catch (sqlError) {
      console.error('SQL error creating/updating match:', sqlError);
      throw sqlError;
    }
  } catch (error: any) {
    console.error('Error creating match:', error);
    console.error('Error details:', error.original || error.message);
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
      const isSqlite = sequelize.getDialect() === 'sqlite';
      const [matches] = await sequelize.query(
        `SELECT * FROM matches WHERE "matchNumber" = ${matchNumber} AND "teamNumber" = ${teamNumber}`
      );
      
      if (!matches || matches.length === 0) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }
      
      const match = matches[0] as MatchRecord;
      
      // Parse coralLevels if it's a string (SQLite or PostgreSQL TEXT)
      if (typeof match.coralLevels === 'string') {
        try {
          match.coralLevels = JSON.parse(match.coralLevels as unknown as string);
          console.log('Parsed coralLevels from database:', match.coralLevels);
        } catch (parseError) {
          console.error('Error parsing coralLevels from database:', parseError);
          match.coralLevels = [];
        }
      } else if (!match.coralLevels) {
        // Ensure coralLevels is always an array
        match.coralLevels = [];
      }
      
      res.json(match);
    } catch (sqlError) {
      console.error('SQL error fetching match:', sqlError);
      
      // Fall back to Sequelize
      try {
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

        // Get coralLevels as array using the helper method
        const matchJSON = match.toJSON();
        matchJSON.coralLevels = match.getCoralLevelsArray();

        res.json(matchJSON);
      } catch (ormError) {
        console.error('Error fetching match with Sequelize:', ormError);
        throw sqlError; // Re-throw the original error
      }
    }
  } catch (error: any) {
    console.error('Error fetching match:', error);
    res.status(500).json({ 
      error: 'Error fetching match', 
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
      console.log('SQL Query: SELECT * FROM matches');
      const [matches] = await sequelize.query('SELECT * FROM matches');
      console.log(`Found ${matches.length} matches`);
      
      // Process each match to handle coralLevels
      const processedMatches = matches.map((match: any) => {
        // Parse coralLevels if it's a string
        if (typeof match.coralLevels === 'string') {
          try {
            match.coralLevels = JSON.parse(match.coralLevels);
          } catch (parseError) {
            console.error(`Error parsing coralLevels for match ${match.matchNumber}/${match.teamNumber}:`, parseError);
            match.coralLevels = [];
          }
        } else if (!match.coralLevels) {
          match.coralLevels = [];
        }
        return match;
      });
      
      res.status(200).json(processedMatches);
    } catch (sqlError) {
      console.error('SQL error fetching matches:', sqlError);
      
      // Try with Sequelize ORM as fallback
      try {
        console.log('Trying to fetch matches with Sequelize ORM');
        const matches = await Match.findAll();
        console.log(`Found ${matches.length} matches with Sequelize`);
        
        // Process each match to handle coralLevels
        const processedMatches = matches.map(match => {
          const matchJSON = match.toJSON();
          matchJSON.coralLevels = match.getCoralLevelsArray();
          return matchJSON;
        });
        
        res.status(200).json(processedMatches);
      } catch (ormError) {
        console.error('Error fetching matches with Sequelize:', ormError);
        throw sqlError; // Re-throw the original error
      }
    }
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ 
      error: 'Error fetching matches', 
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 