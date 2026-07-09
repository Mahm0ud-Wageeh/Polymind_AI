import { test, expect } from '@playwright/test'

test('app boots and sets the Polymind title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Polymind/)

  const root = page.locator('#root')
  await expect(root).not.toBeEmpty()
})

test('the message composer is reachable', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByPlaceholder(/Message Polymind/i)).toBeVisible()
})
