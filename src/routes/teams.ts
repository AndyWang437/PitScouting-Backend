import express from 'express';
import { createTeam, getTeam, getAllTeams, updateTeam } from '../controllers/team.controller';
import upload from '../middleware/upload';

const router = express.Router();

router.post('/', upload.single('robotImage'), createTeam);
router.get('/:teamNumber', getTeam);
router.get('/', getAllTeams);
router.put('/:teamNumber', upload.single('robotImage'), updateTeam);

export default router; 