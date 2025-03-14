/**
 * Fix coralLevels in Frontend
 * 
 * This script helps fix the coralLevels issue in the frontend code.
 * It looks for the TeamDetails.tsx file and adds the necessary code to handle
 * different formats of coralLevels.
 */

const fs = require('fs');
const path = require('path');

console.log('PitScouting Frontend coralLevels Fix Tool');
console.log('==========================================');

// Look for TeamDetails.tsx in the frontend repo
const frontendDir = process.argv[2] || path.join(__dirname, '..', '..', 'PitScouting-frontend');
console.log(`Looking for TeamDetails.tsx in ${frontendDir}`);

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
  console.error('Could not find TeamDetails.tsx file. Please specify the correct frontend directory:');
  console.error('node scripts/fix-frontend-coralLevels.js /path/to/frontend');
  process.exit(1);
}

console.log(`Found TeamDetails.tsx at: ${teamDetailsFile}`);

// Read the file
let content = fs.readFileSync(teamDetailsFile, 'utf8');

// Check if the file contains a direct map on coralLevels
if (content.includes('.map(') && content.includes('coralLevels')) {
  console.log('Found direct mapping on coralLevels. Adding type checking...');
  
  // Find the line with the map function
  const lines = content.split('\n');
  let mapLineIndex = -1;
  let mapLine = '';
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('.map(') && lines[i].includes('coralLevels')) {
      mapLineIndex = i;
      mapLine = lines[i];
      break;
    }
  }
  
  if (mapLineIndex === -1) {
    console.error('Could not find the exact line with the map function. Manual fix required.');
    console.log(`
Add this code before mapping over coralLevels:

const coralLevelsArray = Array.isArray(team.coralLevels) 
  ? team.coralLevels 
  : typeof team.coralLevels === 'string'
    ? (
        // Try to parse the string
        (() => {
          try {
            // Handle PostgreSQL array format
            if (team.coralLevels.startsWith('{') && team.coralLevels.endsWith('}')) {
              return team.coralLevels
                .replace(/^\{|\}$/g, '') // Remove { and }
                .split(',')
                .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes
            }
            // Try standard JSON parse
            return JSON.parse(team.coralLevels);
          } catch (e) {
            console.error('Error parsing coralLevels:', e);
            return [];
          }
        })()
      )
    : [];

// Then use coralLevelsArray instead of team.coralLevels in your map function
{coralLevelsArray.map((level) => (
  <Chip key={level} label={level} />
))}
`);
    process.exit(1);
  }
  
  // Extract the indentation
  const indentation = mapLine.match(/^\s*/)[0];
  
  // Create the new code
  const newCode = `${indentation}const coralLevelsArray = Array.isArray(team.coralLevels) 
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
  
  // Replace team.coralLevels with coralLevelsArray in the map line
  const updatedMapLine = mapLine.replace(/team\.coralLevels/g, 'coralLevelsArray');
  
  // Insert the new code before the map line
  lines.splice(mapLineIndex, 1, newCode, updatedMapLine);
  
  // Join the lines back together
  const updatedContent = lines.join('\n');
  
  // Create a backup of the original file
  fs.writeFileSync(`${teamDetailsFile}.bak`, content);
  console.log(`Created backup at: ${teamDetailsFile}.bak`);
  
  // Write the updated content
  fs.writeFileSync(teamDetailsFile, updatedContent);
  console.log(`Updated ${teamDetailsFile} with coralLevels type checking.`);
  
  console.log('\nFix applied successfully! Please check the file to ensure everything looks correct.');
} else {
  console.log('No direct mapping on coralLevels found. This issue might be elsewhere or already fixed.');
}

// Check for image path issues
console.log('\nChecking for image path issues...');

if (content.includes('/api/storage/') && content.includes('imageUrl')) {
  console.log('Found image path issue. Fixing...');
  
  // Replace /api/storage/${team.imageUrl} with team.imageUrl
  const updatedContent = content.replace(/\/api\/storage\/\$\{([^}]+)\.imageUrl\}/g, '${$1.imageUrl}');
  
  // Write the updated content
  fs.writeFileSync(teamDetailsFile, updatedContent);
  console.log(`Updated ${teamDetailsFile} with image path fix.`);
} else {
  console.log('No image path issues found or already fixed.');
}

console.log('\nAll fixes applied. Please restart your frontend application to see the changes.');
console.log('If you still encounter issues, please refer to the DEPLOYMENT-GUIDE.md file for more detailed instructions.'); 