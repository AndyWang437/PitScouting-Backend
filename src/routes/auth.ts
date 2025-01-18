import express = require('express');
const router = express.Router();
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';

router.post(
  '/register',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('teamNumber').isInt({ min: 1 }),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

export default router; 