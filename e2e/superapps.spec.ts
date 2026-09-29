import { test, expect } from '@playwright/test';

test.describe('Superapps OS End-to-End User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for a clean slate
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('1. Landing page displays features and navigates to app', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Superapps OS/i);
    await expect(page.getByRole('heading', { name: /Your Private Daily Superapp Suite/i })).toBeVisible();
    await expect(page.getByText(/100% Client-Side • Zero-Knowledge Encryption • SQLite WASM/i)).toBeVisible();

    // Verify mini-apps catalog cards
    await expect(page.getByText('Shortlink & Launcher')).toBeVisible();
    await expect(page.getByText('DropZone & P2P Transfer')).toBeVisible();
    await expect(page.getByText('Encrypted Notes Vault')).toBeVisible();
    await expect(page.getByText('Expense & Budget Flow')).toBeVisible();
    await expect(page.getByText('Dev Swiss Knife')).toBeVisible();
    await expect(page.getByText('Focus & Habit Tracker')).toBeVisible();
  });

  test('2. Complete Vault Setup, Unlock & Dashboard Flow', async ({ page }) => {
    await page.goto('/#/app');

    // Setup Master Vault
    await expect(page.getByText('Setup Zero-Knowledge Vault')).toBeVisible();

    const masterPass = 'SuperSecretVault123!';
    await page.getByPlaceholder(/Enter a strong master password/i).fill(masterPass);
    await page.getByPlaceholder(/Repeat your master password/i).fill(masterPass);

    await page.getByRole('button', { name: /Initialize Secure Vault/i }).click();

    // Verify unlocked dashboard
    await expect(page.getByText(/Welcome to your Superapps Dashboard/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/VAULT UNLOCKED & ACTIVE/i)).toBeVisible();

    // Lock Vault
    await page.getByTitle('Lock Vault Now').click();
    await expect(page.getByText('Unlock Superapps Vault')).toBeVisible();

    // Unlock with password
    await page.getByPlaceholder(/Enter master password/i).fill(masterPass);
    await page.getByRole('button', { name: /Unlock Vault/i }).click();

    await expect(page.getByText(/Welcome to your Superapps Dashboard/i)).toBeVisible();
  });

  test('3. Shortlink Hub & Stateless Redirect Generator Flow', async ({ page }) => {
    await page.goto('/#/app');

    // Initialize vault
    await page.getByPlaceholder(/Enter a strong master password/i).fill('TestVault123!');
    await page.getByPlaceholder(/Repeat your master password/i).fill('TestVault123!');
    await page.getByRole('button', { name: /Initialize Secure Vault/i }).click();
    await expect(page.getByText(/Welcome to your Superapps Dashboard/i)).toBeVisible({ timeout: 10000 });

    // Navigate to Shortlinks
    await page.goto('/#/app/shortlinks');
    await expect(page.getByRole('heading', { name: /Shortlink & Quick Launcher/i })).toBeVisible();

    // Generate Stateless Public Redirect
    const urlInput = page.getByPlaceholder(/https:\/\/example\.com\/very\/long\/url/i);
    await urlInput.fill('https://github.com/krisna31/superapps');
    await page.getByRole('button', { name: /Generate Shareable Link & QR/i }).click();

    await expect(page.getByText('Your Shareable Link')).toBeVisible();
    await expect(page.getByAltText('QR Code')).toBeVisible();

    // Add personal shortcut
    await page.getByRole('button', { name: /New Shortlink/i }).click();
    await page.getByPlaceholder(/e.g. gh, mail, cal, pr/i).fill('gh');
    await page.getByPlaceholder(/e.g. GitHub Dashboard/i).fill('GitHub Repo');
    await page.getByPlaceholder('https://...').fill('https://github.com');
    await page.getByRole('button', { name: /Save Shortlink/i }).click();

    await expect(page.getByText('go/gh')).toBeVisible();
    await expect(page.getByText('GitHub Repo')).toBeVisible();
  });

  test('4. Encrypted Notes Vault Flow', async ({ page }) => {
    await page.goto('/#/app');
    await page.getByPlaceholder(/Enter a strong master password/i).fill('TestVault123!');
    await page.getByPlaceholder(/Repeat your master password/i).fill('TestVault123!');
    await page.getByRole('button', { name: /Initialize Secure Vault/i }).click();
    await expect(page.getByText(/Welcome to your Superapps Dashboard/i)).toBeVisible({ timeout: 10000 });

    // Navigate to Notes
    await page.goto('/#/app/notes');
    await expect(page.getByRole('heading', { name: /Encrypted Markdown Notes/i })).toBeVisible();

    // Create note
    await page.getByRole('button', { name: /New Note/i }).click();

    const titleInput = page.getByPlaceholder('Note Title...');
    await titleInput.fill('E2E Test Note');
    await titleInput.blur();

    await expect(page.getByText('E2E Test Note')).toBeVisible();
  });

  test('5. Swiss Knife Utilities Flow', async ({ page }) => {
    await page.goto('/#/app');
    await page.getByPlaceholder(/Enter a strong master password/i).fill('TestVault123!');
    await page.getByPlaceholder(/Repeat your master password/i).fill('TestVault123!');
    await page.getByRole('button', { name: /Initialize Secure Vault/i }).click();
    await expect(page.getByText(/Welcome to your Superapps Dashboard/i)).toBeVisible({ timeout: 10000 });

    // Navigate to Swiss Knife
    await page.goto('/#/app/tools');
    await expect(page.getByRole('heading', { name: /Dev & Daily Swiss Knife/i })).toBeVisible();

    // JSON Studio Beautify
    await page.getByRole('button', { name: /Beautify/i }).click();
    const formattedArea = page.getByPlaceholder(/Click Beautify or Minify to see result/i);
    await expect(formattedArea).toHaveValue(/{\n {2}"name": "Superapps"/);

    // Switch to Hasher
    await page.getByText('Crypto Hasher & UUID').click();
    await page.getByPlaceholder(/Enter text here/i).fill('superapps');
    await expect(page.getByText('Generated UUID v4')).toBeVisible();
  });
});
