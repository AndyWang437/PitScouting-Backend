require('dotenv').config();

const parseDbUrl = (url) => {
  if (!url) return {};
  const matches = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!matches) return {};
  return {
    username: matches[1],
    password: matches[2],
    host: matches[3],
    port: matches[4],
    database: matches[5],
  };
};

const dbConfig = parseDbUrl(process.env.DATABASE_URL);

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'scouting_app',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_TEST_NAME || 'scouting_app_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  },
  production: {
    use_env_variable: 'DATABASE_URL',
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
    }
  }
};