import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const API_URL = 'http://localhost:3001/api';
let USER_A_ID, USER_B_ID, TOKEN_A, TOKEN_B;
const emailA = `userA_${Date.now()}@example.com`;
const emailB = `userB_${Date.now()}@example.com`;
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

    const res = await fetch(`${API_URL}${endpoint}`, {
        method, headers, body
    });
    const data = await res.json();
    return { status: res.status, data };
}

async function runTests() {
    await client.connect();

    console.log("=== 1. CREATE TWO TEST USERS ===");
    await request('POST', '/auth/register', null, JSON.stringify({ email: emailA, password }));
    await request('POST', '/auth/register', null, JSON.stringify({ email: emailB, password }));

    const loginA = await request('POST', '/auth/login', null, JSON.stringify({ email: emailA, password }));
    const loginB = await request('POST', '/auth/login', null, JSON.stringify({ email: emailB, password }));

    TOKEN_A = loginA.data.data.token;
    USER_A_ID = loginA.data.data.user.id;
    TOKEN_B = loginB.data.data.token;
    USER_B_ID = loginB.data.data.user.id;

    console.log(`User A ID: ${USER_A_ID}`);
    console.log(`User B ID: ${USER_B_ID}`);
    console.log(`TEST 1 RESULT: ${USER_A_ID !== USER_B_ID ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 2. USER A CREATE EXPENSES ===");
    let textA = "22-Aug-2026\nUser A Secret Expense - 111 (UserATest)";
    let resA = await request('POST', '/expenses/parse', TOKEN_A, textA, true);
    console.log(`Test 2 (Create A): ${resA.status === 200 ? 'PASS' : 'FAIL'} (Expected 200, got ${resA.status})`);

    console.log("\n=== 3. USER B CREATE EXPENSES ===");
    let textB = "22-Aug-2026\nUser B Secret Expense - 222 (UserBTest)";
    let resB = await request('POST', '/expenses/parse', TOKEN_B, textB, true);
    console.log(`Test 3 (Create B): ${resB.status === 200 ? 'PASS' : 'FAIL'} (Expected 200, got ${resB.status})`);

    console.log("\n=== 4. USER A READ EXPENSES ===");
    let getA = await request('GET', '/expenses', TOKEN_A);
    let hasA = getA.data.data.expenses.some(e => e.description === "User A Secret Expense");
    let noB_inA = !getA.data.data.expenses.some(e => e.description === "User B Secret Expense");
    console.log(`Test 4 (Read A): ${hasA && noB_inA ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 5. USER B READ EXPENSES ===");
    let getB = await request('GET', '/expenses', TOKEN_B);
    let hasB = getB.data.data.expenses.some(e => e.description === "User B Secret Expense");
    let noA_inB = !getB.data.data.expenses.some(e => e.description === "User A Secret Expense");
    console.log(`Test 5 (Read B): ${hasB && noA_inB ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 6. USER A CATEGORIES ===");
    let catA = await request('GET', '/expenses/categories', TOKEN_A);
    let catHasA = catA.data.data.categories.includes("UserATest");
    let catNoB = !catA.data.data.categories.includes("UserBTest");
    console.log(`Test 6 (Cats A): ${catHasA && catNoB ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 7. USER B CATEGORIES ===");
    let catB = await request('GET', '/expenses/categories', TOKEN_B);
    let catHasB = catB.data.data.categories.includes("UserBTest");
    let catNoA = !catB.data.data.categories.includes("UserATest");
    console.log(`Test 7 (Cats B): ${catHasB && catNoA ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 8. CROSS-USER QUERY ATTACK ===");
    let hackB = await request('GET', `/expenses?userId=${USER_A_ID}`, TOKEN_B);
    let hackNoA = !hackB.data.data.expenses.some(e => e.description === "User A Secret Expense");
    let hackHasB = hackB.data.data.expenses.some(e => e.description === "User B Secret Expense");
    console.log(`Test 8 (Cross Query): ${hackNoA && hackHasB ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 9. CROSS-USER DELETE ATTACK ===");
    // User B tries to delete all their expenses. It succeeds for B, but it should NOT affect A.
    await request('DELETE', '/expenses', TOKEN_B);
    let dbCheckA = await client.query("SELECT * FROM expenses WHERE user_id = $1", [USER_A_ID]);
    let dbCheckB = await client.query("SELECT * FROM expenses WHERE user_id = $1", [USER_B_ID]);
    let A_survives = dbCheckA.rows.some(r => r.description === "User A Secret Expense");
    let B_deleted = dbCheckB.rows.length === 0;
    console.log(`Test 9 (Cross Delete / B Delete): ${A_survives && B_deleted ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 10. VALID DELETE ===");
    await request('DELETE', '/expenses', TOKEN_A);
    let validDeleteCheckA = await client.query("SELECT * FROM expenses WHERE user_id = $1", [USER_A_ID]);
    console.log(`Test 10 (Valid Delete A): ${validDeleteCheckA.rows.length === 0 ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 11. DATABASE OWNERSHIP VERIFICATION ===");
    // Re-insert 1 expense for A to verify
    await request('POST', '/expenses/parse', TOKEN_A, "22-Aug-2026\nVerify - 100 (DB)", true);
    let dbAll = await client.query("SELECT * FROM expenses WHERE description = 'Verify'");
    let isIsolated = dbAll.rows.length === 1 && String(dbAll.rows[0].user_id) === String(USER_A_ID);
    console.log(`Test 11 (DB Verify): ${isIsolated ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 12. FILTER ISOLATION ===");
    let filterB = await request('GET', '/expenses?category=DB', TOKEN_B);
    console.log(`Test 12 (Filter cross leak): ${filterB.data.data.expenses.length === 0 ? 'PASS' : 'FAIL'}`);

    console.log("\n=== 15. UNAUTHENTICATED ACCESS ===");
    let ua1 = await request('GET', '/expenses', null);
    let ua2 = await request('GET', '/expenses/categories', null);
    let ua3 = await request('POST', '/expenses/parse', null);
    let ua4 = await request('DELETE', '/expenses', null);
    let uaPass = (ua1.status === 401 && ua2.status === 401 && ua3.status === 401 && ua4.status === 401);
    console.log(`Test 15 (Unauth): ${uaPass ? 'PASS' : 'FAIL'} (Expected strictly 401 across endpoints)`);

    process.exit(0);
}

runTests().catch(console.error);
