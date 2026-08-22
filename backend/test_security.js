import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const API_URL = 'http://localhost:3001/api';
let TOKEN_A;
const emailA = `sec_${Date.now()}@example.com`;
const password = 'password123';

const client = new (pg.Client || pg.default.Client)({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'expense_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function request(method, endpoint, token, body = null, isText = false) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = isText ? 'text/plain' : 'application/json';

    const res = await fetch(`${API_URL}${endpoint}`, { method, headers, body });
    const data = await res.json();
    return { status: res.status, data };
}

async function runTests() {
    await client.connect();

    // Register & Login
    await request('POST', '/auth/register', null, JSON.stringify({ email: emailA, password }));
    const loginRes = await request('POST', '/auth/login', null, JSON.stringify({ email: emailA, password }));
    TOKEN_A = loginRes.data.data.token;
    const USER_A_ID = loginRes.data.data.user.id;

    console.log("=== 1. SQL INJECTION (Category Injection) ===");
    const sqlPayload = "25-Aug-2026\nSQL Hack - 50.00 ('); DROP TABLE expenses; --)";
    await request('POST', '/expenses/parse', TOKEN_A, sqlPayload, true);

    // Verify it didn't kill the table
    try {
        const checkTable = await client.query("SELECT * FROM expenses LIMIT 1");
        console.log("Table surviving SQL injection? PASS");
        // Verify it treated the drop payload as a literal string category
        const checkInject = await client.query("SELECT category FROM expenses WHERE user_id = $1", [USER_A_ID]);
        const safeString = checkInject.rows.some(r => r.category.includes("DROP TABLE expenses"));
        console.log(`Stored literal SQL string smoothly? ${safeString ? 'PASS' : 'FAIL'}`);
    } catch (e) {
        console.log("FAIL: Table crashed", e.message);
    }

    console.log("\n=== 2. NEGATIVE AMOUNTS ===");
    const negativePayload = "26-Aug-2026\nNegative Bal - -500.00 (Food)";
    const negParse = await request('POST', '/expenses/parse', TOKEN_A, negativePayload, true);
    // Parser behavior: likely ignores the line if regex requires positive, or PostgreSQL crashes with 500
    console.log("Negative parse status returned:", negParse.status);

    // Check if it got entered
    const checkNeg = await client.query("SELECT * FROM expenses WHERE user_id = $1 AND description = 'Negative Bal'", [USER_A_ID]);
    console.log(`Negative value blocked from DB? ${checkNeg.rows.length === 0 ? 'PASS' : 'FAIL'} (Expected 0 rows)`);

    console.log("\n=== 3. SQL INJECTION (Authentication API) ===");
    const sqlEmail = "' OR 1=1; --";
    const authInject = await request('POST', '/auth/login', null, JSON.stringify({ email: sqlEmail, password }));
    // express-validator .isEmail() should natively bounce this with 400
    console.log(`SQLi Auth endpoint blocked? ${authInject.status === 400 ? 'PASS' : 'FAIL'} (Expected 400 Bad Request)`);

    client.end();
}

runTests().catch(console.error);
