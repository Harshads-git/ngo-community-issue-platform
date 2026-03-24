// @ts-check
const { test, expect } = require('@playwright/test');

// Use a unique email every test run to avoid "email already registered" errors
const testEmail = `citizen_${Date.now()}@test.com`;
const testPassword = 'Testing@123';
const testName = { first: 'Test', last: 'Citizen' };

// ─────────────────────────────────────────
// SUITE 1 – Public Pages
// ─────────────────────────────────────────
test.describe('Public pages load correctly', () => {

    test('Home page renders with hero section and nav', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/CommunityConnect/);
        await expect(page.locator('nav.navbar')).toBeVisible();
        await expect(page.locator('section.hero-section')).toBeVisible();
        // Use the h1 specifically to avoid matching other elements
        await expect(page.locator('h1').first()).toBeVisible();
        console.log('✅ Home page loaded OK');
    });

    test('Public Issues page renders', async ({ page }) => {
        await page.goto('/pages/public/issues.html');
        await expect(page.locator('h1, h2').first()).toBeVisible();
        console.log('✅ Issues page loaded OK');
    });

    test('Success Stories page renders', async ({ page }) => {
        await page.goto('/pages/public/resolved.html');
        // Use the h1 heading specifically to avoid strict-mode violation
        await expect(page.locator('h1').first()).toBeVisible();
        console.log('✅ Success Stories page loaded OK');
    });

    test('Login page renders form', async ({ page }) => {
        await page.goto('/pages/public/login.html');
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        console.log('✅ Login page loaded OK');
    });

    test('Register page renders form', async ({ page }) => {
        await page.goto('/pages/public/register.html');
        await expect(page.locator('#firstName')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        console.log('✅ Register page loaded OK');
    });
});

// ─────────────────────────────────────────
// SUITE 2 – Citizen Auth & Reporting
// ─────────────────────────────────────────
test.describe('Citizen: Register → Login → Report Issue', () => {

    test('Citizen can register a new account', async ({ page }) => {
        await page.goto('/pages/public/register.html');

        await page.fill('#firstName', testName.first);
        await page.fill('#lastName', testName.last);
        await page.fill('#email', testEmail);
        await page.fill('#password', testPassword);
        await page.fill('#confirmPassword', testPassword);

        // Select citizen role
        await page.selectOption('#roleSelect', 'citizen');

        // Agree to terms if checkbox exists
        const checkbox = page.locator('#agreeTerms');
        if (await checkbox.count() > 0) {
            await checkbox.check();
        }

        await page.click('button[type="submit"]');

        // Registration shows a success alert then redirects after 1.5s delay
        await expect(page.locator('#successAlert')).toBeVisible({ timeout: 8_000 });

        // Now wait for eventual redirect
        await page.waitForURL('**/citizen/dashboard.html', { timeout: 15_000 });
        await expect(page.locator('text=My Reported Issues')).toBeVisible();
        console.log(`✅ Registered as citizen with email: ${testEmail}`);
    });

    test('Logged-in citizen can report an issue', async ({ page }) => {
        await page.goto('/pages/public/login.html');
        await page.fill('#email', testEmail);
        await page.fill('#password', testPassword);
        await page.click('button[type="submit"]');

        // Login redirects immediately after success
        await page.waitForURL('**/citizen/dashboard.html', { timeout: 10_000 });

        // Open report modal
        await page.click('button:has-text("Report New Issue")');
        await expect(page.locator('#reportModal')).toBeVisible({ timeout: 5_000 });

        // Fill in the form
        await page.fill('#issueTitle', 'Playwright Test: Broken Streetlight');
        await page.selectOption('#issueCategory', 'infrastructure');
        await page.fill('#issueDescription', 'The streetlight on Oak Avenue has been out for 3 days and is a safety hazard.');
        await page.fill('#issueLocation', 'Oak Avenue, City Centre');

        await page.click('#submitBtn');

        // Wait for success alert
        await expect(page.locator('#reportAlert')).toContainText('Successfully', { timeout: 10_000 });
        console.log('✅ Issue reported successfully via Citizen Dashboard');

        // Wait for modal to auto-close and table to update
        await expect(page.locator('#reportModal')).not.toBeVisible({ timeout: 5_000 });
        await expect(page.locator('text=Playwright Test: Broken Streetlight')).toBeVisible({ timeout: 10_000 });
        console.log('✅ Reported issue appears in table');
    });

    test('Unauthenticated user is redirected from citizen dashboard', async ({ page }) => {
        // Clear any existing auth data first
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        });
        // Now try to access protected page directly
        await page.goto('/pages/citizen/dashboard.html');
        // Should be redirected to login
        await page.waitForURL('**/login.html', { timeout: 5_000 });
        console.log('✅ Unauthenticated access correctly redirects to login page');
    });
});

// ─────────────────────────────────────────
// SUITE 3 – API Health Checks
// ─────────────────────────────────────────
test.describe('Backend API health checks', () => {

    test('GET /api/issues returns success', async ({ request }) => {
        const response = await request.get('http://127.0.0.1:5000/api/issues');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        console.log(`✅ GET /api/issues returned ${body.data.length} issues`);
    });

    test('POST /api/auth/register with incomplete data returns error', async ({ request }) => {
        const response = await request.post('http://127.0.0.1:5000/api/auth/register', {
            data: { email: 'bad-email', password: '123' },
        });
        expect(response.status()).not.toBe(200);
        const body = await response.json();
        expect(body.success).toBe(false);
        console.log('✅ Invalid registration correctly rejected by API');
    });

    test('POST /api/auth/login with wrong credentials returns 401', async ({ request }) => {
        const response = await request.post('http://127.0.0.1:5000/api/auth/login', {
            data: { email: 'nobody@fake.com', password: 'wrongpass' },
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        console.log('✅ Invalid login correctly returns 401');
    });
});
