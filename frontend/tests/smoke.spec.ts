import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

test.describe('SafeShop smoke', () => {
  test('home loads and shows products grid', async ({ page }) => {
    await page.goto(BASE + '/')
    await expect(page.getByRole('link', { name: 'SafeShop' })).toBeVisible()
    // filter input present
    await expect(page.getByPlaceholder('Search')).toBeVisible()
    // seeded products should appear
    await expect(page.getByText('Smartphone X')).toBeVisible({ timeout: 10000 })
  })

  test('navigate to product detail and add to cart (client-side)', async ({ page }) => {
    await page.goto(BASE + '/')
    await page.getByText('Smartphone X').first().click()
    await expect(page.getByRole('heading', { name: 'Smartphone X' })).toBeVisible()
    await page.getByRole('button', { name: /add to cart/i }).click()
    // go to cart
    await page.getByRole('link', { name: /cart/i }).click()
    await expect(page.getByText('Smartphone X')).toBeVisible()
  })
})
