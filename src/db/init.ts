import { Sequelize } from 'sequelize';
import config from '../../config/config.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize: Sequelize;

if (env === 'production') {
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
    logging: false
  });
} else {
  sequelize = new Sequelize(dbConfig.database!, dbConfig.username!, dbConfig.password!, {
    host: dbConfig.host,
    dialect: 'postgres',
    logging: false
  });
}

const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    console.log('Environment:', env);
    
    // Only force sync in development
    if (env === 'development') {
      await sequelize.sync({ force: true });
      console.log('Database synced in development mode');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export { sequelize, initDb }; 