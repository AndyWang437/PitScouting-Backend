import express from 'express';
import { createMatch, getAllMatches, getMatch } from '../controllers/match.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.post('/', authMiddleware, createMatch);
router.get('/', authMiddleware, getAllMatches);
router.get('/:matchNumber/:teamNumber', authMiddleware, getMatch);

export default router; 