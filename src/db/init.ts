import { Sequelize } from 'sequelize';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../../config/config.js';

const execAsync = promisify(exec);
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
    
    // Try to run migrations on startup
    if (env === 'production') {
      try {
        await execAsync('npx sequelize-cli db:migrate');
        console.log('Migrations completed successfully');
      } catch (migrationError) {
        console.error('Migration error:', migrationError);
        // Don't throw the error, just log it
      }
    }
    
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