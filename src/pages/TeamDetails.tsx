// This file should be moved to the frontend project as it's a React component
// The backend shouldn't contain React components
// You'll need to run these commands in the frontend project:
// npm install react react-dom react-router-dom react-hot-toast --save

// This file should be in PitScouting-frontend/src/pages/ not in the backend

// If you need to keep this file in the backend for reference,
// remove all JSX and React-specific code and convert it to a simple API controller or model
// Example of how this could look as a backend controller:

import { Request, Response } from 'express';

// Define team data interface for type checking
interface TeamData {
  teamNumber: number;
  autoScoreCoral: boolean;
  autoScoreAlgae: boolean;
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
  mustStartSpecificPosition: boolean;
  name: string;
  images: string[];
}

// Controller function to get team details
export const getTeamDetails = async (req: Request, res: Response) => {
  const { teamNumber } = req.params;
  
  try {
    if (!teamNumber) {
      return res.status(400).json({ error: 'Invalid team number' });
    }
    
    // Here you would fetch data from your database
    // const team = await TeamModel.findOne({ where: { teamNumber } });
    
    // For now, we'll return dummy data for illustration
    const teamData: TeamData = {
      teamNumber: parseInt(teamNumber),
      autoScoreCoral: true,
      autoScoreAlgae: false,
      autoStartingPosition: 'Middle',
      teleopDealgifying: true,
      teleopPreference: 'coral',
      scoringPreference: 'betterCoral',
      coralLevels: ['level1', 'level2'],
      endgameType: 'deep',
      robotWidth: 30,
      robotLength: 40,
      robotHeight: 25,
      robotWeight: 120,
      drivetrainType: 'Tank',
      notes: 'Sample team data',
      imageUrl: '/uploads/sample.jpg',
      mustStartSpecificPosition: true,
      name: 'Sample Team',
      images: []
    };
    
    return res.status(200).json(teamData);
  } catch (err: any) {
    console.error('Error fetching team data:', err);
    return res.status(500).json({ error: 'Failed to load team data' });
  }
};

export default { getTeamDetails }; 