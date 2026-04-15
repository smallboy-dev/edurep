#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('EDUREP Desktop Build Script');
console.log('============================\n');

// Check if desktop folder exists
if (!fs.existsSync('./desktop')) {
  console.error('Error: desktop/ folder not found');
  process.exit(1);
}

// Check if desktop has package.json
if (!fs.existsSync('./desktop/package.json')) {
  console.error('Error: desktop/package.json not found');
  process.exit(1);
}

try {
  // Step 1: Build the web app
  console.log('Step 1: Building web application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Web app built successfully!\n');

  // Step 2: Install desktop dependencies
  console.log('Step 2: Installing desktop dependencies...');
  process.chdir('./desktop');
  execSync('npm install', { stdio: 'inherit' });
  console.log('Desktop dependencies installed!\n');

  // Step 3: Build desktop app
  console.log('Step 3: Building desktop application...');
  const platform = process.argv[2] || 'all';
  
  switch (platform) {
    case 'windows':
      execSync('npm run build:windows', { stdio: 'inherit' });
      break;
    case 'mac':
      execSync('npm run build:mac', { stdio: 'inherit' });
      break;
    case 'linux':
      execSync('npm run build:linux', { stdio: 'inherit' });
      break;
    case 'all':
      execSync('npm run build:all', { stdio: 'inherit' });
      break;
    default:
      console.error(`Unknown platform: ${platform}`);
      console.log('Available platforms: windows, mac, linux, all');
      process.exit(1);
  }

  console.log('\nBuild completed successfully!');
  console.log(`Desktop applications are available in: ./desktop/dist/`);

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
