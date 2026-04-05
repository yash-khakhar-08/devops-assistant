const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function initDB() {
    console.log('Connecting to MySQL to initialize schema...');
    
    // Connect without database first to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'ProminentPixel123@',
    });

    try {
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split statements by semicolon and execute them
        const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        for (const stmt of statements) {
            console.log("Executing: " + stmt.substring(0, 50) + "...");
            await connection.query(stmt);
        }
        
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await connection.end();
        process.exit(0);
    }
}

initDB();
