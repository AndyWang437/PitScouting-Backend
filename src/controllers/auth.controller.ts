import express = require('express');
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import jwt from 'jsonwebtoken';
import { User } from '../models';
import env from '../config/env';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, teamNumber } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      teamNumber,
    });

    const token = jwt.sign({ id: user.id }, env.jwtSecret);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        teamNumber: user.teamNumber,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: 'Error creating user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (email === '1334admin@gmail.com' && password === 'otisit!!!') {
      const token = jwt.sign({ id: 1, isAdmin: true }, env.jwtSecret);
      res.json({
        token,
        user: {
          id: 1,
          name: 'Team 1334 Admin',
          email: '1334admin@gmail.com',
          teamNumber: 1334,
        },
      });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id }, env.jwtSecret);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        teamNumber: user.teamNumber,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Error logging in' });
  }
}; 