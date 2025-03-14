import { setupDatabase } from './setup';

async function main() {
  try {
    console.log('Starting database setup script...');
    await setupDatabase();
    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main(); 