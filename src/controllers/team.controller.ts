import express = require('express');
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import { Team } from '../models';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { sequelize } from '../db/init';

// Define interfaces for database records
interface TeamRecord {
  id: number;
  teamNumber: number;
  autoScoreCoral: boolean;
  autoScoreAlgae: boolean;
  mustStartSpecificPosition: boolean;
  autoStartingPosition: string | null;
  teleopDealgifying: boolean;
  teleopPreference: string | null;
  scoringPreference: string | null;
  coralLevels: string[];
  endgameType: string;
  robotWidth: number | null;
  robotLength: number | null;
  robotHeight: number | null;
  robotWeight: number | null;
  drivetrainType: string | null;
  notes: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Add this function at the top of the file, after imports
const checkTeamsTable = async (): Promise<boolean> => {
  try {
    const dialect = sequelize.getDialect();
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name='teams'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams'"
    );
    
    const tableExists = tables.length > 0;
    console.log('Teams table exists:', tableExists);
    
    if (!tableExists) {
      // If table doesn't exist, try to create it
      console.log('Teams table does not exist, attempting to create it...');
      try {
        if (dialect === 'postgres') {
          await sequelize.query(`
            CREATE TABLE IF NOT EXISTS teams (
              id SERIAL PRIMARY KEY,
              "teamNumber" INTEGER NOT NULL,
              "autoScoreCoral" BOOLEAN DEFAULT false,
              "autoScoreAlgae" BOOLEAN DEFAULT false,
              "mustStartSpecificPosition" BOOLEAN DEFAULT false,
              "autoStartingPosition" TEXT,
              "teleopDealgifying" BOOLEAN DEFAULT false,
              "teleopPreference" TEXT,
              "scoringPreference" TEXT,
              "coralLevels" TEXT DEFAULT '[]',
              "endgameType" TEXT DEFAULT 'none',
              "robotWidth" FLOAT,
              "robotLength" FLOAT,
              "robotHeight" FLOAT,
              "robotWeight" FLOAT,
              "drivetrainType" TEXT,
              "notes" TEXT DEFAULT '',
              "imageUrl" TEXT,
              "createdAt" TIMESTAMP DEFAULT NOW(),
              "updatedAt" TIMESTAMP DEFAULT NOW()
            )
          `);
        } else {
          await sequelize.query(`
            CREATE TABLE IF NOT EXISTS teams (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              "teamNumber" INTEGER NOT NULL UNIQUE,
              "autoScoreCoral" BOOLEAN DEFAULT 0,
              "autoScoreAlgae" BOOLEAN DEFAULT 0,
              "mustStartSpecificPosition" BOOLEAN DEFAULT 0,
              "autoStartingPosition" TEXT,
              "teleopDealgifying" BOOLEAN DEFAULT 0,
              "teleopPreference" TEXT,
              "scoringPreference" TEXT,
              "coralLevels" TEXT DEFAULT '[]',
              "endgameType" TEXT DEFAULT 'none',
              "robotWidth" REAL,
              "robotLength" REAL,
              "robotHeight" REAL,
              "robotWeight" REAL,
              "drivetrainType" TEXT,
              "notes" TEXT DEFAULT '',
              "imageUrl" TEXT,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `);
        }
        console.log('Teams table created successfully');
        return true;
      } catch (createError) {
        console.error('Error creating teams table:', createError);
        return false;
      }
    }
    
    return tableExists;
  } catch (error) {
    console.error('Error checking if teams table exists:', error);
    return false;
  }
};

export const createTeam = async (req: Request, res: Response): Promise<void> => {
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

    // Properly handle the image URL
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('Image URL set to:', imageUrl);
    } else {
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

    // Try direct SQL approach
    try {
      // Check if team already exists
      console.log('Checking if team already exists with number:', teamNumber);
      
      // First try with Sequelize
      try {
        const existingTeam = await Team.findOne({ where: { teamNumber } });
        if (existingTeam) {
          console.log('Team exists, updating:', existingTeam.id);
          // Update existing team
          await existingTeam.update(processedData);
          console.log('Team updated successfully:', existingTeam.toJSON());
          res.status(200).json(existingTeam);
          return;
        }
      } catch (sequelizeError) {
        console.error('Sequelize error finding team:', sequelizeError);
        // Continue with direct SQL approach
      }
      
      // Try direct SQL approach
      const isSqlite = sequelize.getDialect() === 'sqlite';
      const [existingTeams] = await sequelize.query(
        `SELECT * FROM teams WHERE "teamNumber" = ${teamNumber}`
      );
      
      if (existingTeams && existingTeams.length > 0) {
        const existingTeam = existingTeams[0] as TeamRecord;
        console.log('Team exists (SQL), updating:', existingTeam.id);
        
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
            UPDATE teams 
            SET ${updateFields}, "updatedAt" = CURRENT_TIMESTAMP 
            WHERE "teamNumber" = ${teamNumber} 
            RETURNING *
          `
          : `
            UPDATE teams 
            SET ${updateFields}, "updatedAt" = NOW() 
            WHERE "teamNumber" = ${teamNumber} 
            RETURNING *
          `;
        
        const [updatedTeams] = await sequelize.query(updateQuery);
        if (updatedTeams && updatedTeams.length > 0) {
          console.log('Team updated successfully (SQL):', updatedTeams[0]);
          res.status(200).json(updatedTeams[0]);
        } else {
          console.error('Team update failed, no data returned');
          res.status(500).json({ 
            error: 'Error updating team', 
            message: 'Team update failed',
            details: 'Database operation succeeded but returned no data'
          });
        }
      } else {
        console.log('Team does not exist, creating new team');
        
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
            INSERT INTO teams (${keys}, "createdAt", "updatedAt") 
            VALUES (${values}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
            RETURNING *
          `
          : `
            INSERT INTO teams (${keys}, "createdAt", "updatedAt") 
            VALUES (${values}, NOW(), NOW()) 
            RETURNING *
          `;
        
        console.log('Insert query:', insertQuery);
        
        try {
          const [newTeams] = await sequelize.query(insertQuery);
          
          // Check if newTeams is defined and has elements
          if (newTeams && Array.isArray(newTeams) && newTeams.length > 0) {
            console.log('Team created successfully (SQL):', newTeams[0]);
            res.status(201).json(newTeams[0]);
          } else {
            console.log('Team created but no data returned from SQL query');
            
            // Try to create the team using Sequelize ORM
            try {
              console.log('Trying to create team using Sequelize ORM');
              const newTeam = await Team.create({
                ...processedData,
                coralLevels: JSON.stringify(coralLevels)
              });
              console.log('Team created successfully with Sequelize:', newTeam.toJSON());
              res.status(201).json(newTeam);
              return;
            } catch (ormError) {
              console.error('Error creating team with Sequelize:', ormError);
              
              // Fetch the team we just created
              try {
                const [createdTeams] = await sequelize.query(
                  `SELECT * FROM teams WHERE "teamNumber" = ${teamNumber}`
                );
                
                if (createdTeams && Array.isArray(createdTeams) && createdTeams.length > 0) {
                  console.log('Retrieved created team:', createdTeams[0]);
                  res.status(201).json(createdTeams[0]);
                } else {
                  console.error('Failed to retrieve created team');
                  res.status(500).json({ 
                    error: 'Error creating team', 
                    message: 'Team was created but could not be retrieved',
                    details: 'Database operation succeeded but returned no data'
                  });
                }
              } catch (fetchError) {
                console.error('Error fetching created team:', fetchError);
                res.status(500).json({ 
                  error: 'Error creating team', 
                  message: 'Team may have been created but could not be retrieved',
                  details: fetchError.message
                });
              }
            }
          }
        } catch (insertError) {
          console.error('Error executing insert query:', insertError);
          
          // Try to create the team using Sequelize ORM as a fallback
          try {
            console.log('Trying to create team using Sequelize ORM after SQL error');
            const newTeam = await Team.create({
              ...processedData,
              coralLevels: JSON.stringify(coralLevels)
            });
            console.log('Team created successfully with Sequelize after SQL error:', newTeam.toJSON());
            res.status(201).json(newTeam);
          } catch (ormError) {
            console.error('Error creating team with Sequelize after SQL error:', ormError);
            throw insertError; // Re-throw the original error
          }
        }
      }
    } catch (sqlError) {
      console.error('SQL error creating/updating team:', sqlError);
      throw sqlError;
    }
  } catch (error: any) {
    console.error('Error creating team:', error);
    console.error('Error details:', error.original || error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      error: 'Error creating team', 
      message: error.message,
      details: error.original?.detail || error.original?.message || error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getTeam = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('getTeam called with params:', req.params);
    const teamNumber = parseInt(req.params.teamNumber);
    
    if (isNaN(teamNumber)) {
      console.error('Invalid team number:', req.params.teamNumber);
      return res.status(400).json({ error: 'Invalid team number' });
    }
    
    console.log('Looking up team with number:', teamNumber);
    
    // Check if teams table exists
    const dialect = sequelize.getDialect();
    console.log('Database dialect:', dialect);
    
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name='teams'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams'"
    );
    
    const teamsTableExists = tables.length > 0;
    console.log('Teams table exists:', teamsTableExists);
    
    if (!teamsTableExists) {
      console.error('Teams table does not exist');
      return res.status(500).json({ error: 'Teams table does not exist' });
    }
    
    // Try direct SQL approach
    const [teams] = await sequelize.query(
      `SELECT * FROM teams WHERE "teamNumber" = ${teamNumber}`
    );
    
    if (!teams || teams.length === 0) {
      console.log('Team not found with number:', teamNumber);
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const team = teams[0] as any; // Type as any to avoid TypeScript errors
    console.log('Team found:', teamNumber);
    
    // Parse coralLevels if it's a string
    if (team.coralLevels) {
      console.log('Team coralLevels (raw):', team.coralLevels);
      
      if (typeof team.coralLevels === 'string') {
        try {
          // Handle different string formats
          if (team.coralLevels.startsWith('{') && team.coralLevels.endsWith('}')) {
            // PostgreSQL array format like "{\"level1\",\"level2\"}"
            const cleanedString = team.coralLevels
              .replace(/^\{|\}$/g, '') // Remove { and }
              .split(',')
              .map((item: string) => item.trim().replace(/^"|"$/g, '')); // Remove quotes
            
            team.coralLevels = cleanedString;
          } else {
            // Try standard JSON parse
            team.coralLevels = JSON.parse(team.coralLevels);
          }
        } catch (error) {
          console.error('Error parsing coralLevels:', error);
          // Fallback to empty array if parsing fails
          team.coralLevels = [];
        }
      }
      
      // Ensure coralLevels is always an array
      if (!Array.isArray(team.coralLevels)) {
        team.coralLevels = [team.coralLevels];
      }
    } else {
      team.coralLevels = [];
    }
    
    // Double check that coralLevels is an array before sending
    if (!Array.isArray(team.coralLevels)) {
      console.error('coralLevels is still not an array after processing:', team.coralLevels);
      team.coralLevels = [];
    }
    
    console.log('Team data (JSON):', team);
    console.log('Final team data being sent:', team);
    console.log('coralLevels type:', typeof team.coralLevels, 'isArray:', Array.isArray(team.coralLevels));
    
    return res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({ 
      error: 'Error fetching team', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamNumber = parseInt(req.params.teamNumber);
    
    if (isNaN(teamNumber)) {
      res.status(400).json({ error: 'Invalid team number' });
      return;
    }

    const team = await Team.findOne({
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
        const oldFilename = path.basename(team.imageUrl);
        const uploadsDir = process.env.NODE_ENV === 'production'
          ? '/opt/render/project/src/uploads'
          : path.join(__dirname, '../../uploads');
        const oldFilePath = path.join(uploadsDir, oldFilename);
        
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log(`Deleted old image: ${oldFilePath}`);
          } catch (err) {
            console.error(`Failed to delete old image: ${oldFilePath}`, err);
          }
        }
      }
    }

    await team.update(updateData);
    res.json(team);
  } catch (error: any) {
    console.error('Error updating team:', error);
    res.status(400).json({ error: 'Error updating team', details: error.message });
  }
};

export const getAllTeams = async (req: Request, res: Response): Promise<void> => {
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
      console.log('SQL Query: SELECT * FROM teams');
      const [teams] = await sequelize.query('SELECT * FROM teams');
      console.log(`Found ${teams.length} teams`);
      
      // Process each team to handle coralLevels
      const processedTeams = teams.map((team: any) => {
        // Parse coralLevels if it's a string
        if (typeof team.coralLevels === 'string') {
          try {
            team.coralLevels = JSON.parse(team.coralLevels);
          } catch (parseError) {
            console.error(`Error parsing coralLevels for team ${team.teamNumber}:`, parseError);
            team.coralLevels = [];
          }
        } else if (!team.coralLevels) {
          team.coralLevels = [];
        }
        return team;
      });
      
      res.status(200).json(processedTeams);
    } catch (sqlError) {
      console.error('SQL error fetching teams:', sqlError);
      
      // Try with Sequelize ORM as fallback
      try {
        console.log('Trying to fetch teams with Sequelize ORM');
        const teams = await Team.findAll();
        console.log(`Found ${teams.length} teams with Sequelize`);
        
        // Process each team to handle coralLevels
        const processedTeams = teams.map(team => {
          const teamJSON = team.toJSON();
          teamJSON.coralLevels = team.getCoralLevelsArray();
          return teamJSON;
        });
        
        res.status(200).json(processedTeams);
      } catch (ormError) {
        console.error('Error fetching teams with Sequelize:', ormError);
        throw sqlError; // Re-throw the original error
      }
    }
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ 
      error: 'Error fetching teams', 
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 