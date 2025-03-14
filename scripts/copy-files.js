const fs = require('fs');
const path = require('path');

// Function to copy a file
function copyFile(source, target) {
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(source, target);
  console.log(`Copied ${source} to ${target}`);
}

// Function to copy a directory recursively
function copyDir(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  }
}

// Copy migrations directory
copyDir('migrations', 'dist/migrations');

// Copy config directory
copyDir('config', 'dist/config');

// Copy scripts directory
if (!fs.existsSync('dist/scripts')) {
  fs.mkdirSync('dist/scripts', { recursive: true });
}

// Copy test-db-setup.ts to dist/scripts
if (fs.existsSync('scripts/test-db-setup.ts')) {
  copyFile('scripts/test-db-setup.ts', 'dist/scripts/test-db-setup.ts');
}

// Copy check-db.js to dist/scripts
if (fs.existsSync('scripts/check-db.js')) {
  copyFile('scripts/check-db.js', 'dist/scripts/check-db.js');
}

// Copy fix-db.js to dist/scripts
if (fs.existsSync('scripts/fix-db.js')) {
  copyFile('scripts/fix-db.js', 'dist/scripts/fix-db.js');
}

// Copy direct-db-fix.js to dist/scripts
if (fs.existsSync('scripts/direct-db-fix.js')) {
  copyFile('scripts/direct-db-fix.js', 'dist/scripts/direct-db-fix.js');
}

// Copy create-test-team.js to dist/scripts
if (fs.existsSync('scripts/create-test-team.js')) {
  copyFile('scripts/create-test-team.js', 'dist/scripts/create-test-team.js');
}

// Copy insert-test-team.js to dist/scripts
if (fs.existsSync('scripts/insert-test-team.js')) {
  copyFile('scripts/insert-test-team.js', 'dist/scripts/insert-test-team.js');
}

// Copy fix-frontend-issues.js to dist/scripts
if (fs.existsSync('scripts/fix-frontend-issues.js')) {
  copyFile('scripts/fix-frontend-issues.js', 'dist/scripts/fix-frontend-issues.js');
}

// Copy .sequelizerc file
copyFile('.sequelizerc', 'dist/.sequelizerc');

// Copy README.md file
if (fs.existsSync('README.md')) {
  copyFile('README.md', 'dist/README.md');
}

// Copy DEPLOYMENT-GUIDE.md file
if (fs.existsSync('DEPLOYMENT-GUIDE.md')) {
  copyFile('DEPLOYMENT-GUIDE.md', 'dist/DEPLOYMENT-GUIDE.md');
}

// Copy FRONTEND-FIX.md file
if (fs.existsSync('FRONTEND-FIX.md')) {
  copyFile('FRONTEND-FIX.md', 'dist/FRONTEND-FIX.md');
}

// Copy FRONTEND-TROUBLESHOOTING.md file
if (fs.existsSync('FRONTEND-TROUBLESHOOTING.md')) {
  copyFile('FRONTEND-TROUBLESHOOTING.md', 'dist/FRONTEND-TROUBLESHOOTING.md');
}

// Copy CHANGES-SUMMARY.md file
if (fs.existsSync('CHANGES-SUMMARY.md')) {
  copyFile('CHANGES-SUMMARY.md', 'dist/CHANGES-SUMMARY.md');
}

// Copy FRONTEND-FIX-GUIDE.md file
if (fs.existsSync('FRONTEND-FIX-GUIDE.md')) {
  copyFile('FRONTEND-FIX-GUIDE.md', 'dist/FRONTEND-FIX-GUIDE.md');
}

// Copy FIXES-SUMMARY.md file
if (fs.existsSync('FIXES-SUMMARY.md')) {
  copyFile('FIXES-SUMMARY.md', 'dist/FIXES-SUMMARY.md');
}

console.log('All files copied successfully!'); 