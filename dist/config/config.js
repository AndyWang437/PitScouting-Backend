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
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: console.log
  },
  test: {
    dialect: 'sqlite',
    storage: './database.test.sqlite',
    logging: false
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