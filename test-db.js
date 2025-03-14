require('dotenv').config();
const { sequelize, initDb } = require('./src/db/init');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    await initDb();
    console.log('Database connection successful!');
    
    // List tables
    const [tables] = await sequelize.query(
      sequelize.getDialect() === 'sqlite'
        ? "SELECT name FROM sqlite_master WHERE type='table'"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Tables in database:', tables);
    
    // Close connection
    await sequelize.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection(); 