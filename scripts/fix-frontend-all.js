/**
 * Fix All Frontend Issues
 * 
 * This script helps fix common frontend issues:
 * 1. coralLevels not being an array
 * 2. Image paths using /api/storage/ instead of the correct path
 * 3. Team details page errors
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('PitScouting Frontend Fix Tool');
console.log('=============================');

// Get frontend directory from command line argument
const frontendDir = process.argv[2];
if (!frontendDir) {
  console.error('Please provide the path to your frontend directory:');
  console.error('node scripts/fix-frontend-all.js /path/to/frontend');
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

// Fix 1: coralLevels not being an array
console.log('\nFix 1: Checking for coralLevels issues...');

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

// Fix 2: Image paths
console.log('\nFix 2: Checking for image path issues...');

// Look for image paths using /api/storage/
const imagePathRegex1 = /src=\{`\/api\/storage\/\$\{([^}]+)\.imageUrl\}`\}/g;
const imagePathRegex2 = /src=\{`\/api\/storage\/\$\{([^}]+)\}`\}/g;
const imagePathRegex3 = /src=\{`\/api\/storage\/${([^}]+)}`\}/g;
const imagePathRegex4 = /src=\{`\/api\/storage\/${([^}]+)\.imageUrl}`\}/g;
const imagePathRegex5 = /src=\{`\/api\/storage\/${([^}]+)\.imageUrl\}`\}/g;

let imagePathFixed = false;

if (content.match(imagePathRegex1)) {
  console.log('Found image path issues (pattern 1). Fixing...');
  content = content.replace(imagePathRegex1, 'src={$1.imageUrl}');
  imagePathFixed = true;
}

if (content.match(imagePathRegex2)) {
  console.log('Found image path issues (pattern 2). Fixing...');
  content = content.replace(imagePathRegex2, 'src={`/uploads/${$1}`}');
  imagePathFixed = true;
}

if (content.match(imagePathRegex3)) {
  console.log('Found image path issues (pattern 3). Fixing...');
  content = content.replace(imagePathRegex3, 'src={`/uploads/${$1}`}');
  imagePathFixed = true;
}

if (content.match(imagePathRegex4)) {
  console.log('Found image path issues (pattern 4). Fixing...');
  content = content.replace(imagePathRegex4, 'src={`/uploads/${$1.imageUrl}`}');
  imagePathFixed = true;
}

if (content.match(imagePathRegex5)) {
  console.log('Found image path issues (pattern 5). Fixing...');
  content = content.replace(imagePathRegex5, 'src={`/uploads/${$1.imageUrl}`}');
  imagePathFixed = true;
}

// Also check for string literals
const stringLiteralRegex = /(['"])\/api\/storage\/([^'"]+)(['"])/g;
if (content.match(stringLiteralRegex)) {
  console.log('Found image path issues in string literals. Fixing...');
  content = content.replace(stringLiteralRegex, '$1/uploads/$2$3');
  imagePathFixed = true;
}

if (!imagePathFixed) {
  console.log('No standard image path issues found. Checking for other patterns...');
  
  // Try to find any image src attributes
  const srcRegex = /src=\{([^}]+)\}/g;
  const srcMatches = content.matchAll(srcRegex);
  
  for (const match of srcMatches) {
    const srcContent = match[1];
    if (srcContent.includes('/api/storage/')) {
      console.log('Found custom image path pattern. Fixing...');
      content = content.replace(
        srcContent, 
        srcContent.replace('/api/storage/', '/uploads/')
      );
      imagePathFixed = true;
    }
  }
}

if (imagePathFixed) {
  console.log('Fixed image paths.');
} else {
  console.log('No image path issues found or fixed.');
}

// Fix 3: Add error handling for team details page
console.log('\nFix 3: Adding error handling for team details page...');

// Find the component return statement
const returnRegex = /(\s*)(return\s*\()/;
const returnMatch = content.match(returnRegex);

if (returnMatch) {
  const indentation = returnMatch[1];
  const errorHandlingCode = `${indentation}// Add error handling
${indentation}const [error, setError] = React.useState(null);
${indentation}const [loading, setLoading] = React.useState(true);

${indentation}React.useEffect(() => {
${indentation}  if (error) {
${indentation}    console.error('Error in team details:', error);
${indentation}  }
${indentation}}, [error]);

${indentation}// Handle loading state
${indentation}if (loading && !team && !error) {
${indentation}  return <div>Loading team details...</div>;
${indentation}}

${indentation}// Handle error state
${indentation}if (error) {
${indentation}  return (
${indentation}    <div>
${indentation}      <h2>Error loading team details</h2>
${indentation}      <p>{error.message || 'Unknown error'}</p>
${indentation}      <button onClick={() => window.location.reload()}>Retry</button>
${indentation}    </div>
${indentation}  );
${indentation}}

${indentation}// Handle missing team data
${indentation}if (!team) {
${indentation}  return <div>Team not found</div>;
${indentation}}

`;

  // Find a good place to insert the error handling code
  const componentBodyStart = content.indexOf('{', content.indexOf('function') !== -1 ? content.indexOf('function') : content.indexOf('=>'));
  if (componentBodyStart !== -1) {
    content = content.slice(0, componentBodyStart + 1) + '\n' + errorHandlingCode + content.slice(componentBodyStart + 1);
    console.log('Added error handling code.');
  } else {
    console.log('Could not find a suitable place to add error handling code.');
  }
} else {
  console.log('Could not find return statement to add error handling.');
}

// Write the updated content
fs.writeFileSync(teamDetailsFile, content);
console.log(`\nUpdated ${teamDetailsFile} with fixes.`);

// Fix 4: Check for fetch calls and add error handling
console.log('\nFix 4: Checking for fetch calls to add error handling...');

// Find fetch or axios calls
const fetchRegex = /(fetch|axios\.get)\(\s*['"`]([^'"`]+)['"`]/g;
const fetchMatches = content.matchAll(fetchRegex);
let fetchFixed = false;

for (const match of Array.from(fetchMatches)) {
  const fetchCall = match[0];
  const fetchType = match[1];
  const url = match[2];
  
  if (url.includes('/api/teams/') || url.includes('/team/')) {
    console.log(`Found ${fetchType} call to ${url}. Adding error handling...`);
    
    if (fetchType === 'fetch') {
      const improvedFetch = fetchCall + `
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch team data: ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          console.log('Team data received:', data);
          // Ensure coralLevels is an array
          if (data.coralLevels && !Array.isArray(data.coralLevels)) {
            if (typeof data.coralLevels === 'string') {
              try {
                data.coralLevels = JSON.parse(data.coralLevels);
              } catch (e) {
                console.error('Error parsing coralLevels:', e);
                data.coralLevels = [];
              }
            } else {
              data.coralLevels = [];
            }
          }
          setLoading(false);
          return data;
        })
        .catch(error => {
          console.error('Error fetching team data:', error);
          setError(error);
          setLoading(false);
        })`;
      
      content = content.replace(fetchCall, improvedFetch);
      fetchFixed = true;
    } else if (fetchType === 'axios.get') {
      const improvedAxios = fetchCall + `
        .then(response => {
          console.log('Team data received:', response.data);
          // Ensure coralLevels is an array
          const data = response.data;
          if (data.coralLevels && !Array.isArray(data.coralLevels)) {
            if (typeof data.coralLevels === 'string') {
              try {
                data.coralLevels = JSON.parse(data.coralLevels);
              } catch (e) {
                console.error('Error parsing coralLevels:', e);
                data.coralLevels = [];
              }
            } else {
              data.coralLevels = [];
            }
          }
          setLoading(false);
          return response;
        })
        .catch(error => {
          console.error('Error fetching team data:', error);
          setError(error);
          setLoading(false);
        })`;
      
      content = content.replace(fetchCall, improvedAxios);
      fetchFixed = true;
    }
  }
}

if (fetchFixed) {
  console.log('Added error handling to fetch/axios calls.');
  fs.writeFileSync(teamDetailsFile, content);
} else {
  console.log('No fetch/axios calls found or fixed.');
}

console.log('\nAll fixes applied. Please restart your frontend application to see the changes.');
console.log('If you still encounter issues, please refer to the FRONTEND-FIX-GUIDE.md file for more detailed instructions.'); 