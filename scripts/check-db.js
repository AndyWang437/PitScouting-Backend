const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkDatabase() {
  console.log('Checking database connection...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
  
  let sequelize;
  
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('Using production database configuration');
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: console.log
      });
    } else {
      console.log('Using development database configuration');
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: console.log
      });
    }
    
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully');
    
    // Check if tables exist
    const dialect = sequelize.getDialect();
    console.log('Database dialect:', dialect);
    
    const [tables] = await sequelize.query(
      dialect === 'sqlite' 
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Existing tables:', tables);
    
    // Close the connection
    await sequelize.close();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Error checking database:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    if (sequelize) {
      try {
        await sequelize.close();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
    
    return false;
  }
}

// Run the check
checkDatabase()
  .then(success => {
    console.log('Database check completed with status:', success ? 'SUCCESS' : 'FAILURE');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error during database check:', error);
    process.exit(1);
  }); 