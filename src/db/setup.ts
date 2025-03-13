import { sequelize } from './init';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { Sequelize } from 'sequelize';

export const setupDatabase = async () => {
  try {
    console.log('Starting database setup...');
    console.log('Database URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
    console.log('Node environment:', process.env.NODE_ENV);
    
    // Run migrations programmatically
    console.log('Running migrations...');
    try {
      // This will sync all models with the database
      // In production, we're not using force: true to avoid data loss
      console.log('Syncing models with database...');
      await sequelize.sync();
      console.log('Database synced successfully');
      
      // List all tables in the database
      try {
        const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in database:', results);
      } catch (error) {
        console.error('Error listing tables:', error);
      }
    } catch (error) {
      console.error('Error syncing database:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
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
        console.log('Admin user created successfully:', user.id);
      } else {
        console.log('Admin user already exists:', existingUser.id);
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Don't throw here, as we want the app to start even if user creation fails
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}; 