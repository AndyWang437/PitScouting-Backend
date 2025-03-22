// This script loads environment variables from .env.production
// and then runs the clear-production-data script
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Path to .env files
const prodEnvPath = path.join(__dirname, '../.env.production');
const regularEnvPath = path.join(__dirname, '../.env');
const backupEnvPath = path.join(__dirname, '../.env.backup');

// Function to run the clear data script
function runClearScript() {
  console.log('Running clear-production-data script...');
  
  const clearScript = spawn('node', [path.join(__dirname, 'clear-production-data.js')], {
    stdio: 'inherit',
    shell: true
  });
  
  clearScript.on('close', (code) => {
    // Restore original .env file
    if (fs.existsSync(backupEnvPath)) {
      try {
        fs.copyFileSync(backupEnvPath, regularEnvPath);
        fs.unlinkSync(backupEnvPath);
        console.log('\nRestored original .env file.');
      } catch (err) {
        console.error('Error restoring .env file:', err);
        console.log('You may need to manually restore your .env file from .env.backup');
      }
    }
    
    console.log(`\nClear script exited with code ${code}`);
    console.log(code === 0 
      ? 'Database cleared successfully.' 
      : 'There was an error clearing the database.');
  });
}

// Check if .env.production exists
if (!fs.existsSync(prodEnvPath)) {
  console.error('Error: .env.production file not found!');
  console.error('Please create it with your production database URL');
  process.exit(1);
}

// Make sure the production URL has been set
const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');
if (prodEnvContent.includes('postgres://your_production_database_url_here')) {
  console.error('Error: You need to set your actual database URL in .env.production');
  console.error('Replace "postgres://your_production_database_url_here" with your actual Render PostgreSQL URL');
  process.exit(1);
}

// Backup the original .env file
try {
  if (fs.existsSync(regularEnvPath)) {
    fs.copyFileSync(regularEnvPath, backupEnvPath);
    console.log('Backed up original .env file to .env.backup');
  }
  
  // Copy .env.production to .env
  fs.copyFileSync(prodEnvPath, regularEnvPath);
  console.log('Using production environment variables');
  
  // Run the script
  runClearScript();
} catch (err) {
  console.error('Error preparing environment:', err);
  process.exit(1);
} 