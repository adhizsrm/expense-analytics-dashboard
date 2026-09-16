import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';
dotenv.config();

const API_URL = 'http://localhost:3001/api';
const SECRET = process.env.JWT_SECRET || 'fallback_secret';
const emailReal = `reset_${Date.now()}@example.com`;
const passwordOld = 'password123';
const passwordNew = 'newPassword456';

const client = new (pg.Client || pg.default.Client)({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'expense_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function request(method, endpoint, body = null) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function runTests() {
    await client.connect();
    let failCount = 0;

    // Setup: Create real user
    await request('POST', '/auth/register', { email: emailReal, password: passwordOld });
    const dbUser = await client.query("SELECT id, password_hash FROM users WHERE email = $1", [emailReal]);
    const realUserId = dbUser.rows[0].id;
    const hashOld = dbUser.rows[0].password_hash;

    console.log("=== 1. Non-existing Email ===");
    let res1 = await request('POST', '/auth/forgot-password', { email: 'wrong@example.com' });
    const pass1 = res1.status === 200 && res1.data.success && !res1.data.dev_only_reset_url;
    console.log(`Test 1: ${pass1 ? 'PASS' : 'FAIL'} (Status 200 but no token)`);
    if (!pass1) failCount++;

    console.log("\n=== 2. Existing Email ===");
    let res2 = await request('POST', '/auth/forgot-password', { email: emailReal });
    const pass2 = res2.status === 200 && res2.data.dev_only_reset_url;
    console.log(`Test 2: ${pass2 ? 'PASS' : 'FAIL'} (Status 200 and mocked URL provided)`);
    if (!pass2) failCount++;

    // Extract token
    const validToken = new URLSearchParams(res2.data.dev_only_reset_url.split('?')[1]).get('resetToken');

    console.log("\n=== 3. Wrong Purpose Token ===");
    // Sign a validly hashed token but wrong purpose
    const derivedSecret = crypto.createHash('sha256').update(SECRET + hashOld).digest('hex');
    const badPurposeToken = jwt.sign({ userId: realUserId, purpose: "something-else" }, derivedSecret, { expiresIn: '15m' });
    let res3 = await request('POST', '/auth/reset-password', { token: badPurposeToken, newPassword: passwordNew });
    console.log(`Test 3: ${res3.status === 400 ? 'PASS' : 'FAIL'} (Expected 400 Invalid purpose)`);
    if (res3.status !== 400) failCount++;

    console.log("\n=== 4. Tampered Payload (Wrong userId) ===");
    // Sign with proper purpose and secret, but wrong userId (try to hack other user's password using your own valid secret?) 
    // Wait, if we use realUserId=999, the backend fetches 999's hash and evaluates. Since we signed it with our own derivedSecret, decoding against user 999's password hash will fail!
    const [header, payload, sig] = validToken.split('.');
    const decPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    decPayload.userId = 999;
    const tampPayload = Buffer.from(JSON.stringify(decPayload)).toString('base64').replace(/=/g, '');
    let res4 = await request('POST', '/auth/reset-password', { token: `${header}.${tampPayload}.${sig}`, newPassword: passwordNew });
    console.log(`Test 4: ${res4.status === 400 ? 'PASS' : 'FAIL'} (Expected 400 tampered signature)`);
    if (res4.status !== 400) failCount++;

    console.log("\n=== 5. Expired Token ===");
    const expToken = jwt.sign({ userId: realUserId, purpose: "password-reset" }, derivedSecret, { expiresIn: '-1s' });
    let res5 = await request('POST', '/auth/reset-password', { token: expToken, newPassword: passwordNew });
    console.log(`Test 5: ${res5.status === 400 ? 'PASS' : 'FAIL'} (Expected 400 Token expired)`);
    if (res5.status !== 400) failCount++;

    console.log("\n=== 6. Valid Reset ===");
    let res6 = await request('POST', '/auth/reset-password', { token: validToken, newPassword: passwordNew });
    console.log(`Test 6: ${res6.status === 200 ? 'PASS' : 'FAIL'} (Expected 200 OK)`);
    if (res6.status !== 200) failCount++;

    console.log("\n=== 7. Old Password Fails ===");
    let res7 = await request('POST', '/auth/login', { email: emailReal, password: passwordOld });
    console.log(`Test 7: ${res7.status === 401 ? 'PASS' : 'FAIL'} (Expected 401 Unauthorized)`);
    if (res7.status !== 401) failCount++;

    console.log("\n=== 8. New Password Succeeds ===");
    let res8 = await request('POST', '/auth/login', { email: emailReal, password: passwordNew });
    console.log(`Test 8: ${res8.status === 200 ? 'PASS' : 'FAIL'} (Expected 200 OK)`);
    if (res8.status !== 200) failCount++;

    console.log("\n=== 9. Token Re-Use Fails (Stateless Invalidation) ===");
    // Submitting the ORIGINAL validToken should now mathematically bounce because password_hash migrated.
    let res9 = await request('POST', '/auth/reset-password', { token: validToken, newPassword: 'anotherPassword' });
    console.log(`Test 9: ${res9.status === 400 ? 'PASS' : 'FAIL'} (Expected 400 Signature Invalid due to DB mutation)`);
    if (res9.status !== 400) failCount++;

    console.log(`\nCOMPLETED: ${failCount} Failures Detected.`);
    await client.end();
}

runTests().catch(console.error);
