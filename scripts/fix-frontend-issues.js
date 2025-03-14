/**
 * Fix Frontend Issues
 * 
 * This script helps fix common frontend issues:
 * 1. coralLevels not being an array
 * 2. Image paths using /api/storage/ instead of the correct path
 */

const fs = require('fs');
const path = require('path');

console.log('PitScouting Frontend Fix Tool');
console.log('=============================');

// Get frontend directory from command line argument
const frontendDir = process.argv[2];
if (!frontendDir) {
  console.error('Please provide the path to your frontend directory:');
  console.error('node scripts/fix-frontend-issues.js /path/to/frontend');
  process.exit(1);
}

console.log(`Looking for frontend files in: ${frontendDir}`);

// Find the TeamDetails component
const possibleTeamDetailsLocations = [
  path.join(frontendDir, 'src', 'components', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'pages', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'views', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'features', 'teams', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'components', 'teams', 'TeamDetails.tsx')
];

let teamDetailsFile = null;
for (const location of possibleTeamDetailsLocations) {
  if (fs.existsSync(location)) {
    teamDetailsFile = location;
    break;
  }
}

if (!teamDetailsFile) {
  console.error('Could not find TeamDetails.tsx file. Please check your frontend directory structure.');
  process.exit(1);
}

console.log(`Found TeamDetails.tsx at: ${teamDetailsFile}`);

// Read the file
let content = fs.readFileSync(teamDetailsFile, 'utf8');

// Create a backup
fs.writeFileSync(`${teamDetailsFile}.bak`, content);
console.log(`Created backup at: ${teamDetailsFile}.bak`);

// Fix 1: coralLevels not being an array
console.log('\nFix 1: Checking for coralLevels issues...');

// Find the line with coralLevels.map
const coralLevelsMapRegex = /(\s*)(team\.coralLevels)\.map\(/;
const match = content.match(coralLevelsMapRegex);

if (match) {
  console.log('Found coralLevels.map() usage. Adding type checking...');
  
  const indentation = match[1];
  const mapLine = match[0];
  
  // Create the fix code
  const fixCode = `${indentation}const coralLevelsArray = Array.isArray(team.coralLevels) 
${indentation}  ? team.coralLevels 
${indentation}  : typeof team.coralLevels === 'string'
${indentation}    ? (
${indentation}        // Try to parse the string
${indentation}        (() => {
${indentation}          try {
${indentation}            // Handle PostgreSQL array format
${indentation}            if (team.coralLevels.startsWith('{') && team.coralLevels.endsWith('}')) {
${indentation}              return team.coralLevels
${indentation}                .replace(/^\\{|\\}$/g, '') // Remove { and }
${indentation}                .split(',')
${indentation}                .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes
${indentation}            }
${indentation}            // Try standard JSON parse
${indentation}            return JSON.parse(team.coralLevels);
${indentation}          } catch (e) {
${indentation}            console.error('Error parsing coralLevels:', e);
${indentation}            return [];
${indentation}          }
${indentation}        })()
${indentation}      )
${indentation}    : [];

`;
  
  // Replace team.coralLevels with coralLevelsArray
  content = content.replace(coralLevelsMapRegex, (match) => {
    return fixCode + match.replace('team.coralLevels', 'coralLevelsArray');
  });
  
  console.log('Added coralLevels type checking.');
} else {
  console.log('No direct coralLevels.map() usage found. Skipping this fix.');
}

// Fix 2: Image paths
console.log('\nFix 2: Checking for image path issues...');

// Look for image paths using /api/storage/
const imagePathRegex = /\/api\/storage\/\$\{([^}]+)\.imageUrl\}/g;
if (content.match(imagePathRegex)) {
  console.log('Found image path issues. Fixing...');
  
  // Replace /api/storage/${team.imageUrl} with ${team.imageUrl}
  content = content.replace(imagePathRegex, '${$1.imageUrl}');
  
  console.log('Fixed image paths.');
} else {
  console.log('No image path issues found.');
}

// Write the updated content
fs.writeFileSync(teamDetailsFile, content);
console.log(`\nUpdated ${teamDetailsFile} with fixes.`);

console.log('\nAll fixes applied. Please restart your frontend application to see the changes.');
console.log('If you still encounter issues, please refer to the FRONTEND-FIX.md file for more detailed instructions.'); 