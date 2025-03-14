require('dotenv').config();

const parseDbUrl = (url) => {
  if (!url) return {};
  
  try {
    // Handle both postgres:// and postgresql:// formats
    const normalizedUrl = url.replace(/^postgres:\/\//, 'postgresql://');
    
    // For SQLite
    if (url.startsWith('sqlite:')) {
      return {
        dialect: 'sqlite',
        storage: url.replace('sqlite:', '')
      };
    }
    
    // For PostgreSQL
    const matches = normalizedUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!matches) {
      console.error('Invalid DATABASE_URL format:', url);
      return {};
    }
    
    return {
      username: matches[1],
      password: matches[2],
      host: matches[3],
      port: matches[4],
      database: matches[5],
      dialect: 'postgres'
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return {};
  }
};

const dbConfig = parseDbUrl(process.env.DATABASE_URL);
console.log('Database config:', { ...dbConfig, password: dbConfig.password ? '******' : undefined });

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