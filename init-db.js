require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const initDb = async () => {
    const client = await pool.connect();
    try {
        console.log('Connecting to PostgreSQL...');

        // Create users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('Table "users" ensured.');

        // Check if default user exists (optional, based on codebase history)
        const res = await client.query('SELECT * FROM users WHERE username = $1', ['zedbee']);
        if (res.rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = bcrypt.hashSync('zedbee123', 10);
            await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['zedbee', hashedPassword]);
            console.log('Default user "zedbee" created.');
        }

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        client.release();
        await pool.end();
    }
};

initDb();
