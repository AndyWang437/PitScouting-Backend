// This script clears data from a PostgreSQL database (used in production environments)
require('dotenv').config();
const { Client } = require('pg');

async function clearProductionDatabase() {
  // Only run if DATABASE_URL is for PostgreSQL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith('postgres')) {
    console.error('This script is intended for PostgreSQL databases only.');
    console.error('Current DATABASE_URL does not appear to be PostgreSQL.');
    console.error('Use the clear-data.js script for SQLite databases.');
    return;
  }

  console.log('Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false // Required for Render PostgreSQL
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    // Start a transaction
    await client.query('BEGIN');

    try {
      // Get admin user to preserve
      const adminResult = await client.query('SELECT * FROM users LIMIT 1');
      const adminUser = adminResult.rows.length > 0 ? adminResult.rows[0] : null;
      console.log('Found admin user to preserve:', adminUser ? adminUser.id : 'None found');

      // Count teams before deletion
      const teamCountBefore = await client.query('SELECT COUNT(*) FROM teams');
      console.log(`Found ${teamCountBefore.rows[0].count} teams before deletion.`);

      // Delete all teams
      const teamResult = await client.query('DELETE FROM teams');
      console.log(`Deleted ${teamResult.rowCount} team records.`);

      // Delete all matches
      const matchResult = await client.query('DELETE FROM matches');
      console.log(`Deleted ${matchResult.rowCount} match records.`);

      // Delete all users except admin
      if (adminUser) {
        const userResult = await client.query('DELETE FROM users WHERE id != $1', [adminUser.id]);
        console.log(`Deleted ${userResult.rowCount} user records, preserved admin user.`);
      }

      // Reset PostgreSQL sequences for auto-increment
      await client.query('ALTER SEQUENCE teams_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE matches_id_seq RESTART WITH 1');
      console.log('Reset auto-increment sequences.');

      // Final verification
      const finalCount = await client.query('SELECT COUNT(*) FROM teams');
      if (parseInt(finalCount.rows[0].count) > 0) {
        console.error(`⚠️ WARNING: After deletion, still found ${finalCount.rows[0].count} teams!`);
      } else {
        console.log('✅ Final verification: 0 teams remaining in database.');
      }

      // Commit transaction
      await client.query('COMMIT');
      console.log('All data cleared successfully while preserving database structure.');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Transaction rolled back due to error:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Database operation failed:', error.message);
  } finally {
    // Close connection
    try {
      await client.end();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing database connection:', err.message);
    }
  }
}

// Run the function
clearProductionDatabase(); 