// @ts-check
const { test, expect } = require('@playwright/test');

// Unique credentials per run to avoid conflicts
const timestamp = Date.now();
const citizenEmail = `citizen_${timestamp}@test.com`;
const ngoEmail = `ngo_${timestamp}@test.com`;
const volEmail = `vol_${timestamp}@test.com`;
const password = 'Testing@123';
const API = 'http://127.0.0.1:5000';

// ─────────────────────────────────────────────────
// SUITE 1 – Public Pages (branding + content check)
// ─────────────────────────────────────────────────
test.describe('Suite 1: Public Pages', () => {

    test('Home page loads with CommuniFix brand and hero', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/CommuniFix/);
        await expect(page.locator('nav.navbar')).toBeVisible();
        await expect(page.locator('section.hero-section')).toBeVisible();
        await expect(page.locator('h1').first()).toBeVisible();
        console.log('✅ Home page OK');
    });

    test('Public Issues page loads', async ({ page }) => {
        await page.goto('/pages/public/issues.html');
        await expect(page).toHaveTitle(/CommuniFix/);
        await expect(page.locator('h1, h2').first()).toBeVisible();
        console.log('✅ Issues page OK');
    });

    test('Success Stories page loads', async ({ page }) => {
        await page.goto('/pages/public/resolved.html');
        await expect(page).toHaveTitle(/CommuniFix/);
        await expect(page.locator('h1').first()).toBeVisible();
        console.log('✅ Resolved page OK');
    });

    test('Login page loads with form fields', async ({ page }) => {
        await page.goto('/pages/public/login.html');
        await expect(page).toHaveTitle(/CommuniFix/);
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
        console.log('✅ Login page OK');
    });

    test('Register page loads with all required form fields', async ({ page }) => {
        await page.goto('/pages/public/register.html');
        await expect(page).toHaveTitle(/CommuniFix/);
        await expect(page.locator('#firstName')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('#roleSelect')).toBeVisible();
        console.log('✅ Register page OK');
    });
});

// ─────────────────────────────────────────────────
// SUITE 2 – Auth Guards (unauthenticated redirects)
// ─────────────────────────────────────────────────
test.describe('Suite 2: Auth Guards', () => {

    async function clearAuth(page) {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        });
    }

    test('Unauthenticated user → citizen dashboard → redirect to login', async ({ page }) => {
        await clearAuth(page);
        await page.goto('/pages/citizen/dashboard.html');
        await page.waitForURL('**/login.html', { timeout: 6_000 });
        console.log('✅ Citizen auth guard OK');
    });

    test('Unauthenticated user → volunteer dashboard → redirect to login', async ({ page }) => {
        await clearAuth(page);
        await page.goto('/pages/volunteer/dashboard.html');
        await page.waitForURL('**/login.html', { timeout: 6_000 });
        console.log('✅ Volunteer auth guard OK');
    });

    test('Unauthenticated user → NGO dashboard → redirect to login', async ({ page }) => {
        await clearAuth(page);
        await page.goto('/pages/ngo/dashboard.html');
        await page.waitForURL('**/login.html', { timeout: 6_000 });
        console.log('✅ NGO auth guard OK');
    });
});

// ─────────────────────────────────────────────────
// SUITE 3 – Citizen Register → Login → Report
// ─────────────────────────────────────────────────
test.describe('Suite 3: Citizen Flow', () => {

    test('Citizen registers a new account', async ({ page }) => {
        await page.goto('/pages/public/register.html');
        await page.fill('#firstName', 'Test');
        await page.fill('#lastName', 'Citizen');
        await page.fill('#email', citizenEmail);
        await page.fill('#password', password);
        await page.fill('#confirmPassword', password);
        await page.selectOption('#roleSelect', 'citizen');
        await page.locator('#termsCheck').check();
        await page.click('button[type="submit"]');
        await expect(page.locator('#successAlert')).toBeVisible({ timeout: 8_000 });
        await page.waitForURL('**/citizen/dashboard.html', { timeout: 15_000 });
        await expect(page.locator('text=My Reported Issues')).toBeVisible();
        console.log(`✅ Citizen registered: ${citizenEmail}`);
    });

    test('Citizen logs in and sees dashboard', async ({ page }) => {
        await page.goto('/pages/public/login.html');
        await page.fill('#email', citizenEmail);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/citizen/dashboard.html', { timeout: 10_000 });
        await expect(page.locator('h2')).toContainText('Welcome');
        console.log('✅ Citizen login OK');
    });

    test('Citizen can report a new issue via the modal', async ({ page }) => {
        // Login first
        await page.goto('/pages/public/login.html');
        await page.fill('#email', citizenEmail);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/citizen/dashboard.html', { timeout: 10_000 });

        // Open the Report Issue modal
        await page.click('button:has-text("Report New Issue")');
        await expect(page.locator('#reportModal')).toBeVisible({ timeout: 5_000 });

        // Fill the form
        await page.fill('#issueTitle', 'QA Test: Broken Streetlight');
        await page.selectOption('#issueCategory', 'infrastructure');
        await page.fill('#issueDescription', 'Streetlight on Test Ave has been out for 3 days. Safety hazard.');
        await page.fill('#issueLocation', 'Test Avenue, City Centre');

        await page.click('#submitBtn');

        // Verify success
        await expect(page.locator('#reportAlert')).toContainText('Successfully', { timeout: 10_000 });
        await expect(page.locator('#reportModal')).not.toBeVisible({ timeout: 5_000 });
        await expect(page.locator('text=QA Test: Broken Streetlight')).toBeVisible({ timeout: 10_000 });
        console.log('✅ Citizen can report an issue');
    });

    test('Login with wrong password shows error message', async ({ page }) => {
        await page.goto('/pages/public/login.html');
        await page.fill('#email', citizenEmail);
        await page.fill('#password', 'WRONG_PASSWORD');
        await page.click('button[type="submit"]');
        await expect(page.locator('#errorAlert')).toBeVisible({ timeout: 6_000 });
        await expect(page.locator('#errorAlert')).not.toHaveClass(/d-none/);
        console.log('✅ Wrong password shows error alert');
    });
});

// ─────────────────────────────────────────────────
// SUITE 4 – Volunteer Registration & Dashboard
// ─────────────────────────────────────────────────
test.describe('Suite 4: Volunteer Flow', () => {

    test('Volunteer registers an account', async ({ page }) => {
        await page.goto('/pages/public/register.html');
        await page.fill('#firstName', 'Test');
        await page.fill('#lastName', 'Volunteer');
        await page.fill('#email', volEmail);
        await page.fill('#password', password);
        await page.fill('#confirmPassword', password);
        await page.selectOption('#roleSelect', 'volunteer');
        await page.locator('#termsCheck').check();
        await page.click('button[type="submit"]');
        await expect(page.locator('#successAlert')).toBeVisible({ timeout: 8_000 });
        await page.waitForURL('**/volunteer/dashboard.html', { timeout: 15_000 });
        console.log(`✅ Volunteer registered: ${volEmail}`);
    });

    test('Volunteer dashboard loads with Available Tasks section', async ({ page }) => {
        // Login as volunteer
        await page.goto('/pages/public/login.html');
        await page.fill('#email', volEmail);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/volunteer/dashboard.html', { timeout: 10_000 });
        await expect(page.locator('h2').first()).toContainText('Volunteer');
        await expect(page.locator('#availableTasksList')).toBeVisible({ timeout: 8_000 });
        console.log('✅ Volunteer dashboard loads OK');
    });
});

// ─────────────────────────────────────────────────
// SUITE 5 – NGO Registration & Dashboard
// ─────────────────────────────────────────────────
test.describe('Suite 5: NGO Flow', () => {

    test('NGO registers an account', async ({ page }) => {
        await page.goto('/pages/public/register.html');
        await page.fill('#firstName', 'Test');
        await page.fill('#lastName', 'NGO');
        await page.fill('#email', ngoEmail);
        await page.fill('#password', password);
        await page.fill('#confirmPassword', password);
        await page.selectOption('#roleSelect', 'ngo');
        // Wait for org fields to appear, then fill them
        await page.fill('#orgName', 'Test NGO Organization');
        await page.locator('#termsCheck').check();
        await page.click('button[type="submit"]');
        await expect(page.locator('#successAlert')).toBeVisible({ timeout: 8_000 });
        await page.waitForURL('**/ngo/dashboard.html', { timeout: 15_000 });
        console.log(`✅ NGO registered: ${ngoEmail}`);
    });

    test('NGO dashboard loads stat cards and issue list', async ({ page }) => {
        await page.goto('/pages/public/login.html');
        await page.fill('#email', ngoEmail);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/ngo/dashboard.html', { timeout: 10_000 });
        await expect(page.locator('h2').first()).toContainText('NGO');
        // Wait for stat cards to load from API
        await expect(page.locator('#statPending')).not.toContainText('...', { timeout: 10_000 });
        console.log('✅ NGO dashboard loads with live stats');
    });
});

// ─────────────────────────────────────────────────
// SUITE 6 – Backend API Health Checks
// ─────────────────────────────────────────────────
test.describe('Suite 6: Backend API Health', () => {

    test('GET / returns backend health message', async ({ request }) => {
        const res = await request.get(`${API}/`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.message).toMatch(/running/i);
        console.log('✅ Backend root health check OK');
    });

    test('GET /api/issues returns success with array of data', async ({ request }) => {
        const res = await request.get(`${API}/api/issues`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        console.log(`✅ GET /api/issues returned ${body.data.length} issues`);
    });

    test('POST /api/auth/register with incomplete data returns 400', async ({ request }) => {
        const res = await request.post(`${API}/api/auth/register`, {
            data: { email: 'bad' },
        });
        expect(res.status()).not.toBe(200);
        const body = await res.json();
        expect(body.success).toBe(false);
        console.log('✅ Incomplete register rejected');
    });

    test('POST /api/auth/login with wrong credentials returns 401', async ({ request }) => {
        const res = await request.post(`${API}/api/auth/login`, {
            data: { email: 'nobody@fake.com', password: 'wrongpass' },
        });
        expect(res.status()).toBe(401);
        const body = await res.json();
        expect(body.success).toBe(false);
        console.log('✅ Invalid login returns 401');
    });

    test('GET /api/auth/me without token returns 401', async ({ request }) => {
        const res = await request.get(`${API}/api/auth/me`);
        expect(res.status()).toBe(401);
        console.log('✅ getMe without token returns 401');
    });

    test('POST /api/issues without auth token returns 401', async ({ request }) => {
        const res = await request.post(`${API}/api/issues`, {
            data: { title: 'Unauthorized test', description: 'Should fail', location: {} },
        });
        expect(res.status()).toBe(401);
        console.log('✅ Create issue without auth returns 401');
    });
});
