const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appApiDir = path.join(__dirname, 'app', 'api');
const appApiBackupDir = path.join(__dirname, 'app', '_api');

try {
  // 1. Rename app/api to app/_api if it exists
  if (fs.existsSync(appApiDir)) {
    console.log('Backing up app/api...');
    fs.renameSync(appApiDir, appApiBackupDir);
  }

  // 2. Run next build with CAPACITOR_BUILD=true
  console.log('Running next build...');
  execSync('CAPACITOR_BUILD=true next build', { 
    stdio: 'inherit',
    env: { ...process.env, CAPACITOR_BUILD: 'true' }
  });

  console.log('Build successful!');

} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} finally {
  // 3. Rename app/_api back to app/api if backup exists
  if (fs.existsSync(appApiBackupDir)) {
    console.log('Restoring app/api...');
    fs.renameSync(appApiBackupDir, appApiDir);
  }
}
