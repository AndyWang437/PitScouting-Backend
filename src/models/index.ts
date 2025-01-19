import { Sequelize } from 'sequelize';
import { sequelize as dbSequelize } from '../db/init';
import config from '../../config/config';
import { User } from './user';
import Team from './team';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as 'development' | 'test' | 'production'];

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
  const dbUrl = process.env[dbConfig.use_env_variable as string];
  if (!dbUrl) throw new Error(`Environment variable ${dbConfig.use_env_variable} is not set`);
  sequelize = new Sequelize(dbUrl, {
    ...dbConfig as DbConfig,
    dialect: 'postgres',
  });
} else {
  sequelize = dbSequelize;
}

// Initialize models
User.initialize(sequelize);
Team.initialize(sequelize);

export { sequelize, User, Team }; 