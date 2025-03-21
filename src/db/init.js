const { Sequelize } = require('sequelize');
const config = require('../../config/config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: env === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  logging: false
});

const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    if (env === 'development') {
      await sequelize.sync({ force: true });
      console.log('Database synced in development mode');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, initDb }; 