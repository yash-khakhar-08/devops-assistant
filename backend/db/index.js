const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_devops',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    try {
        // Just checking connection, actual schema init will be done manually or via a script
        const connection = await pool.getConnection();
        console.log('Connected to MySQL DB');
        connection.release();
    } catch (err) {
        console.error('Error connecting to MySQL DB:', err);
    }
}

initDB();

module.exports = pool;
