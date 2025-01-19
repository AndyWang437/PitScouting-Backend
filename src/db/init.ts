import { Sequelize } from 'sequelize';
import config from '../../config/config';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as 'development' | 'test' | 'production'];

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  dialectOptions: env === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  logging: false
});

export const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Force sync in development only
    if (env === 'development') {
      await sequelize.sync({ force: true });
      console.log('Database synced in development mode');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}; 