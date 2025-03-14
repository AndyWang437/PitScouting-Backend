/**
 * Frontend Issues Diagnostic Script
 * 
 * This script helps diagnose and fix common frontend issues in the PitScouting app.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('PitScouting Frontend Issues Diagnostic Tool');
console.log('==========================================');

// Check if we're in the right directory
const isRootDir = fs.existsSync('package.json') && 
                 fs.existsSync('src') && 
                 fs.existsSync('scripts');

if (!isRootDir) {
  console.error('Error: Please run this script from the project root directory.');
  process.exit(1);
}

// Check for common issues
console.log('\n1. Checking for coralLevels parsing issue...');

// Look for TeamDetails.tsx in the frontend repo
const frontendDir = path.join(__dirname, '..', '..', 'PitScouting-frontend');
const possibleTeamDetailsLocations = [
  path.join(frontendDir, 'src', 'components', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'pages', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'views', 'TeamDetails.tsx'),
  path.join(frontendDir, 'src', 'features', 'teams', 'TeamDetails.tsx')
];

let teamDetailsFile = null;
for (const location of possibleTeamDetailsLocations) {
  if (fs.existsSync(location)) {
    teamDetailsFile = location;
    break;
  }
}

if (teamDetailsFile) {
  console.log(`Found TeamDetails.tsx at: ${teamDetailsFile}`);
  
  // Read the file
  const content = fs.readFileSync(teamDetailsFile, 'utf8');
  
  // Check if the file contains a direct map on coralLevels
  if (content.includes('.map(') && content.includes('coralLevels')) {
    console.log('Potential issue found: Direct mapping on coralLevels without type checking.');
    console.log('\nRecommended fix:');
    console.log(`
// Add this code before mapping over coralLevels:
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
  } else {
    console.log('No direct mapping on coralLevels found. This issue might be elsewhere.');
  }
} else {
  console.log('Could not find TeamDetails.tsx file. Please check your frontend repository structure.');
}

// Check for image path issues
console.log('\n2. Checking for image path issues...');

// Test the backend image paths
console.log('Testing backend image paths...');
try {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:10000';
  console.log(`Using backend URL: ${backendUrl}`);
  
  console.log(`
To fix image path issues:

1. In your frontend code, make sure you're using the correct image path:

// Change this:
<img src={\`/api/storage/\${team.imageUrl}\`} alt="Robot" />

// To this:
<img src={team.imageUrl} alt="Robot" />

2. If the imageUrl in your data already contains a path like "/uploads/filename.png",
   make sure your backend is serving files from that path.

3. We've added routes to handle both paths in the backend:
   - /api/storage/:filename
   - /uploads/:filename
`);
} catch (error) {
  console.error('Error testing image paths:', error.message);
}

// Check for CORS issues
console.log('\n3. Checking for CORS configuration...');
console.log(`
To fix CORS issues:

1. Make sure your backend CORS configuration allows your frontend domain:

app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

2. For development, you can temporarily allow all origins:

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));
`);

// Provide general advice
console.log('\n4. General troubleshooting advice:');
console.log(`
1. Check browser console for errors
2. Use the /frontend-debug endpoint to test API connectivity
3. Verify that your frontend is using the correct API URL
4. Add error boundaries to your React components
5. Use conditional rendering to handle loading states and null data
6. Add proper error handling for API requests
`);

console.log('\nDiagnostic complete. See DEPLOYMENT-GUIDE.md and FRONTEND-TROUBLESHOOTING.md for more detailed instructions.'); 