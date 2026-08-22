import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'expense_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

client.connect().then(async () => {
    const dbAll = await client.query("SELECT * FROM expenses");
    console.log("ALL EXPENSES:", dbAll.rows);
    client.end();
});
