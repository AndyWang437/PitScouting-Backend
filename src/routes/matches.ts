import express from 'express';
import { createMatch, getAllMatches } from '../controllers/match.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Match routes
router.post('/', authMiddleware, createMatch);
router.get('/', authMiddleware, getAllMatches);

export default router; 