import { sequelize } from './init';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { Sequelize } from 'sequelize';

export const setupDatabase = async () => {
  try {
    console.log('Starting database setup...');
    
    // Run migrations programmatically
    console.log('Running migrations...');
    try {
      // This will sync all models with the database
      // In production, we're not using force: true to avoid data loss
      await sequelize.sync();
      console.log('Database synced successfully');
    } catch (error) {
      console.error('Error syncing database:', error);
      throw error;
    }
    
    // Create admin user if it doesn't exist
    console.log('Checking for admin user...');
    try {
      const existingUser = await User.findOne({
        where: {
          email: '1334admin@gmail.com'
        }
      });
      
      if (!existingUser) {
        console.log('Admin user not found, creating...');
        const hashedPassword = await bcrypt.hash('otisit!!!', 10);
        const user = await User.create({
          name: 'Admin',
          email: '1334admin@gmail.com',
          password: hashedPassword,
          teamNumber: 1334
        });
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      // Don't throw here, as we want the app to start even if user creation fails
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}; 