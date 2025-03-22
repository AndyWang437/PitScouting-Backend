const path = require('path');
const fs = require('fs');

// Connect directly to the SQLite database
const sqlite3 = require('sqlite3').verbose();

// Determine the path to the database file
const dbPath = path.resolve(__dirname, '../database.sqlite');

async function clearDatabaseData() {
  // Verify that the database file exists
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at: ${dbPath}`);
    return;
  }

  console.log(`Opening database at: ${dbPath}`);
  
  // Open the database connection
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
    console.log('Connected to the SQLite database.');
  });

  // Get admin user to preserve
  let adminUser = null;
  try {
    await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users LIMIT 1', (err, row) => {
        if (err) {
          console.error('Error fetching admin user:', err.message);
          reject(err);
          return;
        }
        adminUser = row;
        console.log('Found admin user to preserve:', adminUser ? adminUser.id : 'None found');
        resolve();
      });
    });

    // Start a transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err.message);
          reject(err);
          return;
        }
        resolve();
      });
    });

    try {
      // Delete all teams
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM teams', function(err) {
          if (err) {
            console.error('Error deleting teams:', err.message);
            reject(err);
            return;
          }
          console.log(`Deleted ${this.changes} team records.`);
          resolve();
        });
      });

      // Delete all matches
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM matches', function(err) {
          if (err) {
            console.error('Error deleting matches:', err.message);
            reject(err);
            return;
          }
          console.log(`Deleted ${this.changes} match records.`);
          resolve();
        });
      });

      // Delete all users except admin
      if (adminUser) {
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM users WHERE id != ?', [adminUser.id], function(err) {
            if (err) {
              console.error('Error deleting users:', err.message);
              reject(err);
              return;
            }
            console.log(`Deleted ${this.changes} user records, preserved admin user.`);
            resolve();
          });
        });
      }

      // Reset auto-increment counters
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM sqlite_sequence WHERE name IN ("teams", "matches")', function(err) {
          if (err) {
            console.error('Error resetting auto-increment:', err.message);
            reject(err);
            return;
          }
          console.log('Reset auto-increment counters.');
          resolve();
        });
      });

      // Commit the transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            reject(err);
            return;
          }
          console.log('All data cleared successfully while preserving database structure.');
          resolve();
        });
      });
    } catch (error) {
      // Rollback the transaction on error
      await new Promise((resolve) => {
        db.run('ROLLBACK', (err) => {
          if (err) {
            console.error('Error rolling back transaction:', err.message);
          }
          console.error('Transaction rolled back due to error.');
          resolve();
        });
      });
      throw error;
    }
  } catch (error) {
    console.error('Database operation failed:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

// Run the function
clearDatabaseData(); 