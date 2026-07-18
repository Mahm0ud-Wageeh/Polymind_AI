import { test, expect } from '@playwright/test'

test('app boots and sets the Polymind title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Polymind/)

  const root = page.locator('#root')
  await expect(root).not.toBeEmpty()
})

test('unauthenticated users are redirected to sign in', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/auth$/)
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
})
