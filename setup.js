#!/usr/bin/env node

console.log('🚀 Setting up Apka Travel Routes 2026...\n');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function checkEnvironmentFiles() {
  log('📋 Checking environment files...', 'blue');
  
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  const clientEnvPath = path.join(__dirname, 'client', '.env.local');
  
  if (!fs.existsSync(serverEnvPath)) {
    log('⚠️  Server .env file not found. Please create server/.env', 'yellow');
    log('   Copy from server/.env.example if available', 'yellow');
  } else {
    log('✅ Server .env file found', 'green');
  }
  
  if (!fs.existsSync(clientEnvPath)) {
    log('⚠️  Client .env.local file not found. Please create client/.env.local', 'yellow');
    log('   Copy from client/.env.example if available', 'yellow');
  } else {
    log('✅ Client .env.local file found', 'green');
  }
}

function installDependencies() {
  log('\n📦 Installing dependencies...', 'blue');
  
  try {
    log('Installing root dependencies...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });
    
    log('Installing server dependencies...', 'yellow');
    execSync('cd server && npm install', { stdio: 'inherit', shell: true });
    
    log('Installing client dependencies...', 'yellow');
    execSync('cd client && npm install', { stdio: 'inherit', shell: true });
    
    log('✅ All dependencies installed successfully!', 'green');
  } catch (error) {
    log('❌ Error installing dependencies:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function checkMongoDB() {
  log('\n🗄️  Checking MongoDB...', 'blue');
  
  try {
    execSync('mongod --version', { stdio: 'pipe' });
    log('✅ MongoDB is installed', 'green');
  } catch (error) {
    log('⚠️  MongoDB not found locally', 'yellow');
    log('   You can either:', 'yellow');
    log('   1. Install MongoDB Community Edition locally', 'yellow');
    log('   2. Use MongoDB Atlas (cloud) - update MONGODB_URI in server/.env', 'yellow');
  }
}

function showNextSteps() {
  log('\n🎯 Next Steps:', 'blue');
  log('1. Configure your environment files:', 'yellow');
  log('   - server/.env (JWT secrets, MongoDB URI, API keys)', 'yellow');
  log('   - client/.env.local (API URLs and keys)', 'yellow');
  
  log('\n2. Get your API keys:', 'yellow');
  log('   - OpenAI API: https://platform.openai.com/api-keys', 'yellow');
  log('   - OpenWeatherMap: https://openweathermap.org/api', 'yellow');
  log('   - Unsplash: https://unsplash.com/developers', 'yellow');
  
  log('\n3. Start the development servers:', 'yellow');
  log('   npm run dev', 'green');
  
  log('\n4. Access your application:', 'yellow');
  log('   Frontend: http://localhost:3000', 'green');
  log('   Backend:  http://localhost:5000', 'green');
  
  log('\n📚 For detailed instructions, see README.md', 'blue');
  log('\n🚀 Happy coding!', 'green');
}

// Main setup process
async function main() {
  try {
    checkEnvironmentFiles();
    installDependencies();
    checkMongoDB();
    showNextSteps();
    
    log('\n✅ Setup completed successfully!', 'green');
  } catch (error) {
    log('\n❌ Setup failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

main();