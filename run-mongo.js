import { execSync } from 'child_process';
import path from 'path';

const runMongo = () => {
  try {
    const composeFile = path.resolve('./docker-compose.yml');
    console.log('🚀 Starting MongoDB container...');
    execSync(`docker-compose -f ${composeFile} up -d mongodb`, { stdio: 'inherit' });
    console.log('✅ MongoDB container is up and running on port 27017');
  } catch (error) {
    console.error('❌ Failed to start MongoDB container:', error);
  }
};

// Allow running directly via Node
if (require.main === module) {
  runMongo();
}

export { runMongo };