import { Sequelize } from 'sequelize';
import config from '../../config/config.js';
import fs from 'fs';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize: Sequelize;

console.log('Initializing database connection...');
console.log('Environment:', env);
console.log('Database config:', dbConfig);

// Force using SQLite for development
if (env === 'development') {
  console.log('Using SQLite for development');
  
  // Ensure the directory exists for SQLite database
  const dbDir = path.dirname(dbConfig.storage);
  if (!fs.existsSync(dbDir) && dbDir !== '.') {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created directory for SQLite database: ${dbDir}`);
  }
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: console.log
  });
  
  console.log(`SQLite database initialized at: ${dbConfig.storage}`);
} else if (env === 'production' && process.env.DATABASE_URL) {
  console.log('Using production database configuration with DATABASE_URL');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
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
  console.log('Using database configuration from config');
  
  sequelize = new Sequelize({
    ...dbConfig,
    logging: console.log
  });
  
  console.log('Database connection initialized with config');
}

const initDb = async () => {
  try {
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    console.log('Environment:', env);
    
    // Check if tables exist
    try {
      const [tables] = await sequelize.query(
        sequelize.getDialect() === 'sqlite' 
          ? "SELECT name FROM sqlite_master WHERE type='table'"
          : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      console.log('Existing tables:', tables);
    } catch (error) {
      console.error('Error checking tables:', error);
    }
    
    // Only force sync in development if explicitly requested
    if (env === 'development' && process.env.FORCE_SYNC === 'true') {
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