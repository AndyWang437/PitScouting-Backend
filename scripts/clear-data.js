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
      // Count teams before deletion for verification
      let teamCount = 0;
      await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM teams', (err, row) => {
          if (err) {
            console.error('Error counting teams:', err.message);
            reject(err);
            return;
          }
          teamCount = row.count;
          console.log(`Found ${teamCount} teams before deletion.`);
          resolve();
        });
      });

      // Delete all teams with a more forceful approach
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

      // Double-check to make sure teams are really gone
      await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM teams', (err, row) => {
          if (err) {
            console.error('Error counting teams after deletion:', err.message);
            reject(err);
            return;
          }
          if (row.count > 0) {
            console.error(`WARNING: Still found ${row.count} teams after deletion! Attempting more aggressive deletion...`);
            // Try another approach
            db.run('DELETE FROM teams WHERE 1=1', function(err) {
              if (err) {
                console.error('Error in aggressive team deletion:', err.message);
                reject(err);
                return;
              }
              console.log(`Aggressively deleted ${this.changes} more team records.`);
              resolve();
            });
          } else {
            console.log('Team deletion confirmed: 0 teams remaining.');
            resolve();
          }
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

      // Reset auto-increment counters - be more thorough
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM sqlite_sequence', function(err) {
          if (err) {
            console.error('Error resetting all auto-increment counters:', err.message);
            // Try more targeted approach as fallback
            db.run('DELETE FROM sqlite_sequence WHERE name IN ("teams", "matches")', function(err2) {
              if (err2) {
                console.error('Error resetting specific auto-increment counters:', err2.message);
                reject(err2);
                return;
              }
              console.log('Reset team and match auto-increment counters.');
              resolve();
            });
            return;
          }
          console.log('Reset ALL auto-increment counters.');
          resolve();
        });
      });

      // Vacuum the database to reclaim space
      await new Promise((resolve, reject) => {
        db.run('VACUUM', function(err) {
          if (err) {
            console.error('Error during VACUUM:', err.message);
            // Not a critical error, so we still resolve
            resolve();
            return;
          }
          console.log('Database vacuumed to reclaim space.');
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

      // Final verification
      await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM teams', (err, row) => {
          if (err) {
            console.error('Error in final team count verification:', err.message);
            reject(err);
            return;
          }
          if (row.count > 0) {
            console.error(`⚠️ WARNING: After all operations, still found ${row.count} teams! Database may need manual intervention.`);
          } else {
            console.log('✅ Final verification: 0 teams remaining in database.');
          }
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