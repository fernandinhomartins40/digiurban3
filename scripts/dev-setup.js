
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up development environment...');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found!');
  console.log('📋 Please copy .env.example to .env and configure your DATABASE_URL');
  console.log('   Example: cp .env.example .env');
  process.exit(1);
}

console.log('✅ Environment setup complete!');
console.log('🚀 Starting development servers...');
