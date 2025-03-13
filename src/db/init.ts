import { Sequelize } from 'sequelize';
import config from '../../config/config.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize: Sequelize;

console.log('Initializing database connection...');
console.log('Environment:', env);
console.log('Database URL exists:', !!process.env.DATABASE_URL);

if (env === 'production') {
  console.log('Using production database configuration');
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set!');
    throw new Error('DATABASE_URL environment variable is required in production');
  }
  
  sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  });
  
  console.log('Production database connection initialized');
} else {
  console.log('Using development database configuration');
  console.log('Database config:', {
    database: dbConfig.database,
    username: dbConfig.username,
    host: dbConfig.host
  });
  
  sequelize = new Sequelize(dbConfig.database!, dbConfig.username!, dbConfig.password!, {
    host: dbConfig.host,
    dialect: 'postgres',
    logging: console.log
  });
  
  console.log('Development database connection initialized');
}

const initDb = async () => {
  try {
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    console.log('Environment:', env);
    
    // Only force sync in development
    if (env === 'development') {
      console.log('Syncing database in development mode...');
      await sequelize.sync({ force: true });
      console.log('Database synced in development mode');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export { sequelize, initDb }; 