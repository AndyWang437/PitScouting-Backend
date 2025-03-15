/**
 * Direct Frontend Fix Script
 * 
 * This script directly fixes the frontend issues by:
 * 1. Adding code to handle coralLevels as an array
 * 2. Fixing image paths
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('PitScouting Direct Frontend Fix Tool');
console.log('===================================');

// Get the frontend URL from command line argument
const frontendUrl = process.argv[2];
if (!frontendUrl) {
  console.error('Please provide the URL of your frontend:');
  console.error('node scripts/fix-frontend-direct.js https://1334pitscouting.vercel.app');
  process.exit(1);
}

console.log(`Fixing frontend at: ${frontendUrl}`);

// Function to fetch the team details page
function fetchTeamDetailsPage(teamNumber) {
  return new Promise((resolve, reject) => {
    const url = `${frontendUrl}/team/${teamNumber}`;
    console.log(`Fetching team details page from: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to fix the coralLevels issue in the JavaScript code
function fixCoralLevelsIssue(jsCode) {
  console.log('Fixing coralLevels issue in JavaScript code...');
  
  // Look for patterns that use team.coralLevels.map
  const coralLevelsMapRegex = /(\w+)\.coralLevels\.map\(/g;
  
  // Replace with a safe version that checks if it's an array first
  const fixedCode = jsCode.replace(coralLevelsMapRegex, (match, objName) => {
    return `(Array.isArray(${objName}.coralLevels) ? ${objName}.coralLevels : (typeof ${objName}.coralLevels === 'string' ? JSON.parse(${objName}.coralLevels || '[]') : [])).map(`;
  });
  
  return fixedCode;
}

// Function to fix image paths
function fixImagePaths(jsCode) {
  console.log('Fixing image paths in JavaScript code...');
  
  // Look for patterns that use /api/storage/ in image paths
  const imagePathRegex = /\/api\/storage\/(\$\{[^}]+\}|\w+)/g;
  
  // Replace with /uploads/
  const fixedCode = jsCode.replace(imagePathRegex, '/uploads/$1');
  
  return fixedCode;
}

// Main function to fix the frontend
async function fixFrontend() {
  try {
    // Fetch the team details page
    const teamDetailsPage = await fetchTeamDetailsPage(1);
    
    // Extract JavaScript code from the page
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
    let match;
    let fixedPage = teamDetailsPage;
    
    while ((match = scriptRegex.exec(teamDetailsPage)) !== null) {
      const originalScript = match[1];
      let fixedScript = originalScript;
      
      // Fix coralLevels issue
      fixedScript = fixCoralLevelsIssue(fixedScript);
      
      // Fix image paths
      fixedScript = fixImagePaths(fixedScript);
      
      // Replace the script in the page
      if (fixedScript !== originalScript) {
        fixedPage = fixedPage.replace(originalScript, fixedScript);
      }
    }
    
    // Save the fixed page to a file
    const outputFile = 'fixed-team-details.html';
    fs.writeFileSync(outputFile, fixedPage);
    console.log(`Fixed page saved to: ${outputFile}`);
    
    console.log('\nFixes applied successfully!');
    console.log('\nInstructions for deploying the fix:');
    console.log('1. Find the JavaScript files in your frontend project that handle team details');
    console.log('2. Look for code that uses team.coralLevels.map() and replace it with the safe version');
    console.log('3. Look for image paths using /api/storage/ and replace them with /uploads/');
    console.log('\nAlternatively, you can use the code in the fixed-team-details.html file as a reference.');
    
  } catch (error) {
    console.error('Error fixing frontend:', error.message);
    process.exit(1);
  }
}

// Run the main function
fixFrontend(); 