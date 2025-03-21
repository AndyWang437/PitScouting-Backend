import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
console.log('Environment:', env);

let sequelize: Sequelize;

console.log('Database config:', {
  dialect: env === 'production' ? 'postgres' : 'sqlite',
  storage: env === 'production' ? undefined : './database.sqlite',
  password: process.env.DATABASE_URL ? '********' : undefined
});

const initDb = async (): Promise<Sequelize> => {
  try {
    console.log('Initializing database...');
    
    if (env === 'production') {
      console.log('Using PostgreSQL for production');
      
      try {
        sequelize = new Sequelize(process.env.DATABASE_URL!, {
          dialect: 'postgres',
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          },
          logging: console.log
        });
        
        await sequelize.authenticate();
        console.log('Database connection established successfully with SSL.');
      } catch (sslError) {
        console.error('Error connecting with SSL:', sslError);
        
        try {
          console.log('Trying to connect without SSL...');
          sequelize = new Sequelize(process.env.DATABASE_URL!, {
            dialect: 'postgres',
            logging: console.log
          });
          
          await sequelize.authenticate();
          console.log('Database connection established successfully without SSL.');
        } catch (noSslError) {
          console.error('Error connecting without SSL:', noSslError);
          throw noSslError;
        }
      }
    } else {
      console.log('Using SQLite for development');
      
      const dbDir = path.dirname('./database.sqlite');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: console.log
      });
      
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      
      await sequelize.sync();
      console.log('Database synced in development mode');
    }
    
    try {
      const [tables] = await sequelize.query(
        sequelize.getDialect() === 'sqlite'
          ? "SELECT name FROM sqlite_master WHERE type='table'"
          : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      
      console.log('Existing tables:', tables);
    } catch (error) {
      console.error('Error checking existing tables:', error);
    }
    
    console.log('Database initialized successfully');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export { sequelize, initDb }; 