import { Sequelize } from 'sequelize';
import { sequelize as dbSequelize } from '../db/init';
import config from '../../config/config';
import { User } from './user';
import Team from './team';
import Match from './match';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as 'development' | 'test' | 'production'];

console.log('Initializing models...');
console.log('Environment:', env);

interface DbConfig {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  dialect: string;
  logging?: boolean;
  use_env_variable?: string;
  dialectOptions?: {
    ssl?: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
}

let sequelize: Sequelize;

if ('use_env_variable' in dbConfig && dbConfig.use_env_variable) {
  console.log(`Using environment variable ${dbConfig.use_env_variable} for database connection`);
  const dbUrl = process.env[dbConfig.use_env_variable as string];
  if (!dbUrl) {
    console.error(`Environment variable ${dbConfig.use_env_variable} is not set`);
    throw new Error(`Environment variable ${dbConfig.use_env_variable} is not set`);
  }
  console.log(`Database URL from environment variable exists: ${!!dbUrl}`);
  
  sequelize = new Sequelize(dbUrl, {
    ...dbConfig as DbConfig,
    dialect: 'postgres',
  });
  
  console.log('Sequelize instance created from environment variable');
} else {
  console.log('Using sequelize instance from db/init');
  sequelize = dbSequelize;
}


const initializeModels = () => {
  try {
    console.log('Initializing User model...');
    User.initialize(sequelize);
    console.log('User model initialized successfully');
    
    console.log('Initializing Team model...');
    Team.initialize(sequelize);
    console.log('Team model initialized successfully');
    
    console.log('Initializing Match model...');
    Match.initialize(sequelize);
    console.log('Match model initialized successfully');
    
    console.log('All models initialized successfully');
  } catch (error) {
    console.error('Error initializing models:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

initializeModels();

export { sequelize, User, Team, Match }; 