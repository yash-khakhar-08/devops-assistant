const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateDB() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ai_devops'
    });
    try {
        await pool.query('ALTER TABLE user_messages ADD COLUMN env_id VARCHAR(100) DEFAULT NULL');
        console.log('Added env_id to user_messages');
    } catch (e) { console.log('Column might exist or error:', e.message); }
    process.exit(0);
}
migrateDB();
