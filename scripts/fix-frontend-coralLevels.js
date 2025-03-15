/**
 * Fix coralLevels Issue in Frontend
 * 
 * This script fixes the issue where coralLevels is not an array,
 * causing "TypeError: e.map is not a function" errors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('PitScouting Frontend Fix Tool - coralLevels Fix');
console.log('==============================================');

// Get frontend directory from command line argument
const frontendDir = process.argv[2];
if (!frontendDir) {
  console.error('Please provide the path to your frontend directory:');
  console.error('node scripts/fix-frontend-coralLevels.js /path/to/frontend');
  process.exit(1);
}

console.log(`Looking for frontend files in: ${frontendDir}`);

// Find the TeamDetails component
const possibleTeamDetailsLocations = [
  path.join(frontendDir, 'src', 'components', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'pages', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'views', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'features', 'teams', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'components', 'teams', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'pages', 'team', '[id].tsx'),
  path.join(frontendDir, 'src', 'pages', 'team', '[teamNumber].tsx'),
  path.join(frontendDir, 'pages', 'team', '[id].tsx'),
  path.join(frontendDir, 'pages', 'team', '[teamNumber].tsx')
];

let teamDetailsFile = null;
for (const location of possibleTeamDetailsLocations) {
  if (fs.existsSync(location)) {
    teamDetailsFile = location;
    break;
  }
}

if (!teamDetailsFile) {
  console.error('Could not find TeamDetails.tsx file. Searching for any file that might contain team details...');
  
  try {
    // Try to find any file that might contain team details using grep
    const grepCommand = process.platform === 'win32' 
      ? `findstr /s /i "coralLevels" "${frontendDir}\\**\\*.tsx" "${frontendDir}\\**\\*.jsx" "${frontendDir}\\**\\*.js"`
      : `grep -r "coralLevels" --include="*.tsx" --include="*.jsx" --include="*.js" ${frontendDir}`;
    
    const result = execSync(grepCommand, { encoding: 'utf8' });
    const files = result.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        // Extract filename from grep output
        const match = line.match(/^([^:]+):/);
        return match ? match[1] : null;
      })
      .filter(file => file !== null);
    
    if (files.length > 0) {
      teamDetailsFile = files[0];
      console.log(`Found potential team details file at: ${teamDetailsFile}`);
    }
  } catch (error) {
    console.error('Error searching for files:', error.message);
  }
  
  if (!teamDetailsFile) {
    console.error('Could not find any file with team details. Please check your frontend directory structure.');
    process.exit(1);
  }
}

console.log(`Found team details file at: ${teamDetailsFile}`);

// Read the file
let content = fs.readFileSync(teamDetailsFile, 'utf8');

// Create a backup
fs.writeFileSync(`${teamDetailsFile}.bak`, content);
console.log(`Created backup at: ${teamDetailsFile}.bak`);

// Fix coralLevels not being an array
console.log('\nChecking for coralLevels issues...');

// Find the line with coralLevels.map
const coralLevelsMapRegex = /(\s*)(team\.coralLevels|data\.coralLevels)\.map\(/;
const match = content.match(coralLevelsMapRegex);

if (match) {
  console.log('Found coralLevels.map() usage. Adding type checking...');
  
  const indentation = match[1];
  const coralLevelsVar = match[2];
  
  // Create the fix code
  const fixCode = `${indentation}const coralLevelsArray = Array.isArray(${coralLevelsVar}) 
${indentation}  ? ${coralLevelsVar} 
${indentation}  : typeof ${coralLevelsVar} === 'string'
${indentation}    ? (
${indentation}        // Try to parse the string
${indentation}        (() => {
${indentation}          try {
${indentation}            // Handle PostgreSQL array format
${indentation}            if (${coralLevelsVar}.startsWith('{') && ${coralLevelsVar}.endsWith('}')) {
${indentation}              return ${coralLevelsVar}
${indentation}                .replace(/^\\{|\\}$/g, '') // Remove { and }
${indentation}                .split(',')
${indentation}                .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes
${indentation}            }
${indentation}            // Try standard JSON parse
${indentation}            return JSON.parse(${coralLevelsVar});
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
    return fixCode + match.replace(coralLevelsVar, 'coralLevelsArray');
  });
  
  console.log('Added coralLevels type checking.');
} else {
  console.log('No direct coralLevels.map() usage found. Adding defensive code...');
  
  // Try to find where coralLevels might be used
  const coralLevelsUsageRegex = /(const|let|var)(\s+)(\w+)(\s*)(=)(\s*)(team|data)\.coralLevels/;
  const usageMatch = content.match(coralLevelsUsageRegex);
  
  if (usageMatch) {
    const variableName = usageMatch[3];
    const objectName = usageMatch[7];
    const indentation = usageMatch[0].match(/^\s*/)[0];
    
    const fixCode = `const ${variableName} = (() => {
${indentation}  const rawCoralLevels = ${objectName}.coralLevels;
${indentation}  if (Array.isArray(rawCoralLevels)) {
${indentation}    return rawCoralLevels;
${indentation}  }
${indentation}  if (typeof rawCoralLevels === 'string') {
${indentation}    try {
${indentation}      // Handle PostgreSQL array format
${indentation}      if (rawCoralLevels.startsWith('{') && rawCoralLevels.endsWith('}')) {
${indentation}        return rawCoralLevels
${indentation}          .replace(/^\\{|\\}$/g, '') // Remove { and }
${indentation}          .split(',')
${indentation}          .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes
${indentation}      }
${indentation}      // Try standard JSON parse
${indentation}      return JSON.parse(rawCoralLevels);
${indentation}    } catch (e) {
${indentation}      console.error('Error parsing coralLevels:', e);
${indentation}      return [];
${indentation}    }
${indentation}  }
${indentation}  return [];
${indentation}})()`;
    
    content = content.replace(coralLevelsUsageRegex, fixCode);
    console.log(`Added defensive code for coralLevels variable: ${variableName}`);
  } else {
    console.log('Could not find coralLevels usage pattern. Adding general defensive code...');
    
    // Find the component function or class
    const componentRegex = /(function|const)\s+(\w+)\s*(\([^)]*\)|=\s*\([^)]*\)\s*=>)/;
    const componentMatch = content.match(componentRegex);
    
    if (componentMatch) {
      const componentName = componentMatch[2];
      const componentStart = content.indexOf(componentMatch[0]);
      const indentation = '  ';
      
      const fixCode = `
// Helper function to safely parse coralLevels
function safelyParseCoralLevels(coralLevels) {
  if (Array.isArray(coralLevels)) {
    return coralLevels;
  }
  if (typeof coralLevels === 'string') {
    try {
      // Handle PostgreSQL array format
      if (coralLevels.startsWith('{') && coralLevels.endsWith('}')) {
        return coralLevels
          .replace(/^\\{|\\}$/g, '') // Remove { and }
          .split(',')
          .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes
      }
      // Try standard JSON parse
      return JSON.parse(coralLevels);
    } catch (e) {
      console.error('Error parsing coralLevels:', e);
      return [];
    }
  }
  return [];
}

`;
      
      content = content.slice(0, componentStart) + fixCode + content.slice(componentStart);
      console.log(`Added general helper function for parsing coralLevels before component ${componentName}`);
    }
  }
}

// Write the updated content
fs.writeFileSync(teamDetailsFile, content);
console.log(`\nUpdated ${teamDetailsFile} with fixes.`);
console.log('\nFix applied. Please restart your frontend application to see the changes.');
console.log('If you still encounter issues, please run the more comprehensive fix:');
console.log('npm run fix-frontend-all /path/to/frontend'); 