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

// Copy .sequelizerc file
copyFile('.sequelizerc', 'dist/.sequelizerc');

console.log('All files copied successfully!'); 