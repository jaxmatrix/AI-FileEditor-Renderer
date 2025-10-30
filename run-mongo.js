const { execSync } = require('child_process');
const path = require('path');

const runMongo = () => {
  try {
    console.log('🚀 Starting MongoDB container...');

    // Check if container already exists
    try {
      execSync('podman ps -a --format "{{.Names}}" | grep -q "^local-mongodb$"', { stdio: 'pipe' });
      console.log('📦 MongoDB container exists, checking if running...');

      // Check if it's running
      try {
        execSync('podman ps --format "{{.Names}}" | grep -q "^local-mongodb$"', { stdio: 'pipe' });
        console.log('✅ MongoDB container is already running on port 27017');
        return;
      } catch (notRunning) {
        console.log('🔄 Starting existing MongoDB container...');
        execSync('podman start local-mongodb', { stdio: 'inherit' });
        console.log('✅ MongoDB container started on port 27017');
        return;
      }
    } catch (notExists) {
      console.log('📦 Creating new MongoDB container...');
    }

    // Load environment variables from backend/.env
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve('./backend/.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    const username = envVars.MONGO_USERNAME || 'root';
    const password = envVars.MONGO_PASSWORD || 'example';

    // Use podman directly with full image name
    execSync(`podman run -d --name local-mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=${username} -e MONGO_INITDB_ROOT_PASSWORD=${password} -v ./mongodb_data:/data/db docker.io/library/mongo:6.0`, { stdio: 'inherit' });

    console.log('✅ MongoDB container is up and running on port 27017');
  } catch (error) {
    console.error('❌ Failed to start MongoDB container:', error);
  }
};

// Allow running directly via Node
if (require.main === module) {
  runMongo();
}

module.exports = { runMongo };