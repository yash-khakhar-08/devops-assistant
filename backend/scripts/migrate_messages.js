const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function migrateDB() {
    console.log('Connecting to MySQL for migration...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ai_devops'
    });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role VARCHAR(20) NOT NULL,
                content TEXT,
                files JSON,
                plan TEXT,
                logs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('user_messages table created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrateDB();
