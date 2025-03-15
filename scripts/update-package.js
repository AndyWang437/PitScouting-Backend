/**
 * Update package.json with frontend fix scripts
 */

const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Read package.json
console.log(`Reading package.json from ${packageJsonPath}`);
let packageJson;
try {
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  packageJson = JSON.parse(packageJsonContent);
} catch (error) {
  console.error(`Error reading package.json: ${error.message}`);
  process.exit(1);
}

// Add new scripts
console.log('Adding frontend fix scripts to package.json');
packageJson.scripts = packageJson.scripts || {};

// Add fix-frontend script
packageJson.scripts['fix-frontend'] = 'node scripts/fix-frontend-coralLevels.js';
packageJson.scripts['fix-frontend-all'] = 'node scripts/fix-frontend-all.js';

// Write updated package.json
console.log('Writing updated package.json');
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('package.json updated successfully!');
console.log('New scripts added:');
console.log('- npm run fix-frontend [frontend-path]');
console.log('- npm run fix-frontend-all [frontend-path]'); 