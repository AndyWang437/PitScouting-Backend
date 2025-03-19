"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("./setup");
async function main() {
    try {
        console.log('Starting database setup script...');
        await (0, setup_1.setupDatabase)();
        console.log('Database setup completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}
main();
