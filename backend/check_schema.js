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
client.connect().then(() => {
    return client.query(`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'date'`);
}).then(res => {
    console.log("EXACT_RESULT:", JSON.stringify(res.rows, null, 2));
    process.exit(0);
}).catch(e => {
    console.error("ERROR", e);
    process.exit(1);
});
