import express = require('express');
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import { Team } from '../models';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received team data:', JSON.stringify(req.body, null, 2));
    console.log('File:', req.file);
    
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

    let coralLevels = [];
    try {
      if (typeof req.body.coralLevels === 'string') {
        coralLevels = JSON.parse(req.body.coralLevels);
        console.log('Parsed coralLevels from string:', coralLevels);
      } else if (Array.isArray(req.body.coralLevels)) {
        coralLevels = req.body.coralLevels;
        console.log('Using coralLevels array directly:', coralLevels);
      } else {
        console.log('No coralLevels provided, using empty array');
      }
    } catch (error) {
      console.error('Error parsing coralLevels:', error, 'Value was:', req.body.coralLevels);
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

    // Check if team already exists
    console.log('Checking if team already exists with number:', teamNumber);
    const existingTeam = await Team.findOne({ where: { teamNumber } });
    if (existingTeam) {
      console.log('Team exists, updating:', existingTeam.id);
      // Update existing team
      await existingTeam.update(processedData);
      console.log('Team updated successfully:', existingTeam.toJSON());
      res.status(200).json(existingTeam);
    } else {
      console.log('Team does not exist, creating new team');
      // Create new team
      try {
        const team = await Team.create(processedData);
        console.log('Team created successfully:', team.toJSON());
        res.status(201).json(team);
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        if (dbError.sql) {
          console.error('SQL Query:', dbError.sql);
        }
        if (dbError.parameters) {
          console.error('SQL Parameters:', dbError.parameters);
        }
        if (dbError.parent) {
          console.error('Parent error:', dbError.parent);
        }
        throw dbError;
      }
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

export const getTeam = async (req: Request, res: Response): Promise<void> => {
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

    // Verify image exists if imageUrl is set
    if (team.imageUrl) {
      const filename = path.basename(team.imageUrl);
      const uploadsDir = process.env.NODE_ENV === 'production'
        ? '/opt/render/project/src/uploads'
        : path.join(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`Image file not found: ${filePath}`);
        team.imageUrl = null;
      }
    }

    res.json(team);
  } catch (error: any) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Error fetching team', details: error.message });
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
    const { search, drivetrain, endgameType, autoPosition, teleopPreference } = req.query;
    const where: any = {};

    if (search) {
      where.teamNumber = { [Op.like]: `%${search}%` };
    }

    if (drivetrain) {
      where.drivetrainType = { [Op.iLike]: `%${drivetrain}%` };
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

    console.log('Querying teams with where clause:', JSON.stringify(where, null, 2));
    const teams = await Team.findAll({ where });
    console.log(`Found ${teams.length} teams`);
    
    // Verify all image URLs
    for (const team of teams) {
      if (team.imageUrl) {
        const filename = path.basename(team.imageUrl);
        const uploadsDir = process.env.NODE_ENV === 'production'
          ? '/opt/render/project/src/uploads'
          : path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadsDir, filename);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`Image file not found: ${filePath}`);
          team.imageUrl = null;
        }
      }
    }
    
    res.json(teams);
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    console.error('Error details:', error.original || error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      error: 'Error fetching teams', 
      message: error.message,
      details: error.original?.detail || error.original?.message || error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 