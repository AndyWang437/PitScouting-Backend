/**
 * This script helps diagnose and fix common frontend issues
 * Run with: node scripts/fix-frontend-issues.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Backend API URL
  apiUrl: process.env.API_URL || 'http://localhost:10000',
  
  // Frontend build directory
  frontendBuildDir: process.env.FRONTEND_BUILD_DIR || '../frontend/build',
  
  // Frontend package.json path
  frontendPackageJsonPath: process.env.FRONTEND_PACKAGE_JSON || '../frontend/package.json',
  
  // Backend package.json path
  backendPackageJsonPath: process.env.BACKEND_PACKAGE_JSON || './package.json'
};

// Main function
async function main() {
  console.log('Frontend Issue Diagnosis and Fix Tool');
  console.log('====================================');
  console.log('');
  
  // Check if frontend directory exists
  if (!fs.existsSync(path.resolve(config.frontendBuildDir))) {
    console.log(`❌ Frontend build directory not found at: ${config.frontendBuildDir}`);
    console.log('   Make sure you have built your frontend application.');
    console.log('');
  } else {
    console.log(`✅ Frontend build directory found at: ${config.frontendBuildDir}`);
    
    // Check for index.html
    const indexHtmlPath = path.join(path.resolve(config.frontendBuildDir), 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      console.log('✅ index.html found in build directory');
      
      // Check for common issues in index.html
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      checkIndexHtml(indexHtml);
    } else {
      console.log('❌ index.html not found in build directory');
    }
  }
  
  // Check frontend package.json
  if (fs.existsSync(path.resolve(config.frontendPackageJsonPath))) {
    console.log(`✅ Frontend package.json found at: ${config.frontendPackageJsonPath}`);
    
    // Parse package.json
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(config.frontendPackageJsonPath), 'utf8'));
    
    // Check for homepage field
    if (packageJson.homepage) {
      console.log(`✅ homepage field found in package.json: ${packageJson.homepage}`);
    } else {
      console.log('❌ homepage field not found in package.json');
      console.log('   This can cause issues with asset paths in production builds.');
      console.log('   Consider adding: "homepage": "." or "homepage": "/" to your package.json');
    }
    
    // Check for proxy field
    if (packageJson.proxy) {
      console.log(`✅ proxy field found in package.json: ${packageJson.proxy}`);
      
      // Check if proxy matches our API URL
      if (packageJson.proxy !== config.apiUrl) {
        console.log(`⚠️ proxy field (${packageJson.proxy}) doesn't match expected API URL (${config.apiUrl})`);
        console.log('   This might cause API requests to fail in development.');
      }
    } else {
      console.log('❌ proxy field not found in package.json');
      console.log(`   Consider adding: "proxy": "${config.apiUrl}" to your package.json for development`);
    }
    
    // Check for dependencies
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for React Router
    if (dependencies['react-router-dom']) {
      console.log(`✅ react-router-dom found: ${dependencies['react-router-dom']}`);
    } else {
      console.log('❓ react-router-dom not found in dependencies');
      console.log('   If you are using routing, make sure it is installed.');
    }
    
    // Check for Axios or other HTTP client
    if (dependencies.axios) {
      console.log(`✅ axios found: ${dependencies.axios}`);
    } else {
      console.log('❓ axios not found in dependencies');
      console.log('   If you are making API requests, consider using axios or ensure fetch is properly configured.');
    }
  } else {
    console.log(`❌ Frontend package.json not found at: ${config.frontendPackageJsonPath}`);
  }
  
  console.log('');
  console.log('Checking backend CORS configuration...');
  
  // Check backend package.json
  if (fs.existsSync(path.resolve(config.backendPackageJsonPath))) {
    console.log(`✅ Backend package.json found at: ${config.backendPackageJsonPath}`);
    
    // Check for cors dependency
    const backendPackageJson = JSON.parse(fs.readFileSync(path.resolve(config.backendPackageJsonPath), 'utf8'));
    const backendDependencies = { ...backendPackageJson.dependencies, ...backendPackageJson.devDependencies };
    
    if (backendDependencies.cors) {
      console.log(`✅ cors package found: ${backendDependencies.cors}`);
    } else {
      console.log('❌ cors package not found in backend dependencies');
      console.log('   This might cause CORS issues. Consider installing cors: npm install cors');
    }
  }
  
  console.log('');
  console.log('Recommendations:');
  console.log('1. Visit the frontend debugging tool: ' + config.apiUrl + '/frontend-debug');
  console.log('2. Check browser console for errors when the white screen appears');
  console.log('3. Ensure your frontend is correctly configured to connect to the backend API');
  console.log('4. Make sure team data is being properly handled, especially the coralLevels field');
  console.log('');
  
  // Provide specific fixes
  console.log('Common fixes:');
  console.log('1. Update your API base URL in the frontend to point to: ' + config.apiUrl);
  console.log('2. Add proper error handling in your components');
  console.log('3. Ensure coralLevels is always treated as an array');
  console.log('4. Add a loading state to prevent white screen during API calls');
  console.log('5. Wrap your components in error boundaries');
  console.log('');
  
  console.log('Example code for handling coralLevels:');
  console.log(`
  // Ensure coralLevels is always an array
  const processTeamData = (team) => {
    if (!team) return null;
    
    // Handle coralLevels
    if (team.coralLevels) {
      if (typeof team.coralLevels === 'string') {
        try {
          team.coralLevels = JSON.parse(team.coralLevels);
        } catch (e) {
          console.error('Error parsing coralLevels:', e);
          team.coralLevels = [];
        }
      }
    } else {
      team.coralLevels = [];
    }
    
    return team;
  };
  `);
}

// Check for common issues in index.html
function checkIndexHtml(html) {
  // Check for base href tag
  if (html.includes('<base href=')) {
    console.log('✅ <base> tag found in index.html');
    
    // Extract the href value
    const baseHrefMatch = html.match(/<base href="([^"]+)"/);
    if (baseHrefMatch && baseHrefMatch[1]) {
      console.log(`   Base href: ${baseHrefMatch[1]}`);
    }
  } else {
    console.log('❓ No <base> tag found in index.html');
    console.log('   This might be fine, but could cause issues with routing in some cases.');
  }
  
  // Check for absolute paths in script and link tags
  const scriptSrcRegex = /<script[^>]+src="(\/[^"]+)"/g;
  const linkHrefRegex = /<link[^>]+href="(\/[^"]+)"/g;
  
  let scriptMatch;
  let hasAbsoluteScriptPaths = false;
  
  while ((scriptMatch = scriptSrcRegex.exec(html)) !== null) {
    if (!hasAbsoluteScriptPaths) {
      console.log('⚠️ Absolute paths found in script tags:');
      hasAbsoluteScriptPaths = true;
    }
    console.log(`   ${scriptMatch[1]}`);
  }
  
  let linkMatch;
  let hasAbsoluteLinkPaths = false;
  
  while ((linkMatch = linkHrefRegex.exec(html)) !== null) {
    if (!hasAbsoluteLinkPaths) {
      console.log('⚠️ Absolute paths found in link tags:');
      hasAbsoluteLinkPaths = true;
    }
    console.log(`   ${linkMatch[1]}`);
  }
  
  if (!hasAbsoluteScriptPaths && !hasAbsoluteLinkPaths) {
    console.log('✅ No absolute paths found in script or link tags');
  } else {
    console.log('   Absolute paths can cause issues when deploying to subdirectories.');
    console.log('   Consider using relative paths or setting the homepage field in package.json.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Error running diagnosis:', error);
  process.exit(1);
}); 