"use strict";
// This file should be moved to the frontend project as it's a React component
// The backend shouldn't contain React components
// You'll need to run these commands in the frontend project:
// npm install react react-dom react-router-dom react-hot-toast --save
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamDetails = void 0;
// Controller function to get team details
const getTeamDetails = async (req, res) => {
    const { teamNumber } = req.params;
    try {
        if (!teamNumber) {
            return res.status(400).json({ error: 'Invalid team number' });
        }
        // Here you would fetch data from your database
        // const team = await TeamModel.findOne({ where: { teamNumber } });
        // For now, we'll return dummy data for illustration
        const teamData = {
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
    }
    catch (err) {
        console.error('Error fetching team data:', err);
        return res.status(500).json({ error: 'Failed to load team data' });
    }
};
exports.getTeamDetails = getTeamDetails;
exports.default = { getTeamDetails: exports.getTeamDetails };
