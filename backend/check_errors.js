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
    const q1 = await client.query(`SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;`);
    console.log("SCHEMA:", JSON.stringify(q1.rows, null, 2));

    const q2 = await client.query(`SELECT id, email, created_at FROM users ORDER BY id;`);
    console.log("ROWS:", JSON.stringify(q2.rows, null, 2));

    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
