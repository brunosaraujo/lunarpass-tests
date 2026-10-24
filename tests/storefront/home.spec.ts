import { test, expect } from '../../support'

test.beforeEach(async ({ app }) => {
  await app.store.homePage.go()
})

test('deve validar o titulo na aba do navegador', async ({ app }) => {
  // Expect a title "to contain" a substring.
  await expect(app.store.homePage.page).toHaveTitle(/Lunar Pass/)
})

test('deve exibir o slogan na homepage', async ({ app }) => {
  await expect(app.store.homePage.slogan).toBeVisible()
})
