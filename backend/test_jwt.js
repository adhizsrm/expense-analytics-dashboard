import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3001/api';
const SECRET = process.env.JWT_SECRET || 'fallback_secret';
const email = `test_${Date.now()}@example.com`;
const password = 'password123';

async function runTests() {
    console.log('--- STARTING CHECKPOINT 6 MIDDLEWARE TESTS ---\n');

    // Helper
    const request = async (method, endpoint, tokenHeader) => {
        const headers = tokenHeader ? { Authorization: tokenHeader } : {};
        const res = await fetch(`${API_URL}${endpoint}`, { method, headers });
        return res.status;
    };

    // Register and Login to get a valid token
    await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const { data: { token } } = await loginRes.json();
    console.log('✅ Generated valid token for tests');

    // Test 1: No header
    let status = await request('GET', '/expenses', null);
    console.log(`Test 1: No Authorization header -> Expected: 401 | Actual: ${status} | ${status === 401 ? 'PASS' : 'FAIL'}`);

    // Test 2: Random token
    status = await request('GET', '/expenses', 'Bearer abc123def456');
    console.log(`Test 2: Random token -> Expected: 401 | Actual: ${status} | ${status === 401 ? 'PASS' : 'FAIL'}`);

    // Test 3: Malformed headers
    let s1 = await request('GET', '/expenses', 'abc123def456');
    let s2 = await request('GET', '/expenses', 'Bearer ');
    let s3 = await request('GET', '/expenses', 'Basic abc123def456');
    console.log(`Test 3: Malformed (No Bearer) -> Expected: 401 | Actual: ${s1} | ${s1 === 401 ? 'PASS' : 'FAIL'}`);
    console.log(`Test 3: Malformed (Bearer only) -> Expected: 401 | Actual: ${s2} | ${s2 === 401 ? 'PASS' : 'FAIL'}`);
    console.log(`Test 3: Malformed (Basic scheme) -> Expected: 401 | Actual: ${s3} | ${s3 === 401 ? 'PASS' : 'FAIL'}`);

    // Test 4: Valid JWT
    status = await request('GET', '/expenses', `Bearer ${token}`);
    console.log(`Test 4: Valid JWT -> Expected: 200 | Actual: ${status} | ${status === 200 ? 'PASS' : 'FAIL'}`);

    // Test 5: Modified JWT
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    decodedPayload.userId = 888; // tamper
    const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64').replace(/=/g, '');
    const tamperedToken = `${header}.${tamperedPayload}.${signature}`;
    status = await request('GET', '/expenses', `Bearer ${tamperedToken}`);
    console.log(`Test 5: Tampered JWT -> Expected: 401 | Actual: ${status} | ${status === 401 ? 'PASS' : 'FAIL'}`);

    // Test 6: Expired JWT (safest way is to generate one locally)
    const expiredToken = jwt.sign({ userId: 1, email: 'exp@test.com' }, SECRET, { expiresIn: '-10s' });
    status = await request('GET', '/expenses', `Bearer ${expiredToken}`);
    console.log(`Test 6: Expired JWT -> Expected: 401 | Actual: ${status} | ${status === 401 ? 'PASS' : 'FAIL'}`);

    // Test 7: Wrong secret
    const wrongSecretToken = jwt.sign({ userId: 1, email: 'fake@test.com' }, 'completely-wrong-secret', { expiresIn: '1h' });
    status = await request('GET', '/expenses', `Bearer ${wrongSecretToken}`);
    console.log(`Test 7: Wrong secret JWT -> Expected: 401 | Actual: ${status} | ${status === 401 ? 'PASS' : 'FAIL'}`);

    // Test 10: All protected routes
    console.log(`\nTest 10: Testing all explicitly protected routes:`);

    // POST /parse requires a valid body, so parsing a stub will return 400 if it passes auth. 
    // If it bounces auth, it returns 401. 
    const checkRoute = async (method, route) => {
        const noAuth = await request(method, route, null);
        const badAuth = await request(method, route, 'Bearer fake');
        const validRes = await fetch(`${API_URL}${route}`, {
            method, headers: { Authorization: `Bearer ${token}` }
        });
        const valid = validRes.status;
        console.log(`${method} /api${route} -> No Auth: ${noAuth} (Exp 401) | Bad Auth: ${badAuth} (Exp 401) | Valid Auth: ${valid} (Exp 200/400) | ${noAuth === 401 && badAuth === 401 ? 'PASS' : 'FAIL'}`);
    };

    await checkRoute('GET', '/expenses');
    await checkRoute('GET', '/expenses/categories');
    await checkRoute('POST', '/expenses/parse'); // Expect 400 Bad Request on Valid Auth because no body is passed
    // DO NOT test DELETE in automated loop unless you don't mind dropping test expenses! I won't run DELETE to be safe.
}

runTests().catch(console.error);
