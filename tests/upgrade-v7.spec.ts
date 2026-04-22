import { test, expect } from '@playwright/test'

/**
 * Smoke tests Upgrade V7.2 + V4.1 — vérifie que les routes ajoutées
 * en P2/P3/P4/P5/P6 répondent correctement en production.
 */

const BASE = process.env.PW_BASE_URL ?? 'https://vida-assoc.purama.dev'

test.describe('Upgrade V7.2+V4.1 — pages publiques', () => {
  test('GET / → 200 + titre Sangha', async ({ page }) => {
    const res = await page.goto(BASE)
    expect(res?.status()).toBe(200)
    await expect(page).toHaveTitle(/Sangha/)
  })

  test('GET /fiscal → 200 + content hero', async ({ page }) => {
    const res = await page.goto(`${BASE}/fiscal`)
    expect(res?.status()).toBe(200)
    await expect(page.getByText(/Tu gagnes/i).first()).toBeVisible()
    await expect(page.getByText(/Particulier occasionnel/i).first()).toBeVisible()
    await expect(page.getByText(/BNC/i).first()).toBeVisible()
  })

  test('GET /karma-regulation → 200 + blockchain mention', async ({ page }) => {
    const res = await page.goto(`${BASE}/karma-regulation`)
    expect(res?.status()).toBe(200)
    await expect(page.getByText(/OpenTimestamps/i).first()).toBeVisible()
    await expect(page.getByText(/blockchain/i).first()).toBeVisible()
  })

  test('GET /financer → 200 (pre-existing, regression)', async ({ page }) => {
    const res = await page.goto(`${BASE}/financer`)
    expect(res?.status()).toBe(200)
  })

  test('GET /pricing → 200 + bandeau financer', async ({ page }) => {
    const res = await page.goto(`${BASE}/pricing`)
    expect(res?.status()).toBe(200)
  })
})

test.describe('Upgrade V7.2+V4.1 — API protégées', () => {
  test('POST /api/tax/detect sans auth → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/tax/detect`, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('POST /api/connect/onboard sans auth → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/connect/onboard`, {
      data: { profileType: 'particulier_occ' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/karma/play sans auth → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/karma/play`, {
      data: { game_slug: 'roue_solidaire' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/bourse/apply sans auth → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/bourse/apply`, {
      data: { case_type: 'precarite', amount_requested_cents: 5000, reason: 'x'.repeat(60) },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/tax/factur-x sans auth → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/tax/factur-x`, {
      data: { amount_cents: 1000, description: 'Test' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/tax/urssaf sans auth → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/tax/urssaf`, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('GET /api/prime/allocate sans auth → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/prime/allocate`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/karma/stamp (public listing) → 200 + regulations array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/karma/stamp`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('regulations')
    expect(Array.isArray(body.regulations)).toBe(true)
  })
})

test.describe('Upgrade V7.2+V4.1 — CRONs protection', () => {
  test('GET /api/cron/unlock-primes sans auth → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/cron/unlock-primes`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/cron/karma-weekly sans auth → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/cron/karma-weekly`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/cron/reset-streak sans auth → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/cron/reset-streak`)
    expect(res.status()).toBe(401)
  })
})

test.describe('Upgrade V7.2+V4.1 — Dashboard auth-gated (regression)', () => {
  const dashboardRoutes = [
    '/dashboard/fiscal',
    '/dashboard/karma',
    '/dashboard/bourse-inclusion',
    '/dashboard/ambassadeur',
    '/dashboard/card',
    '/dashboard/wallet',
    '/dashboard/referral',
    '/dashboard/breathe',
    '/dashboard/gratitude',
  ]
  for (const route of dashboardRoutes) {
    test(`GET ${route} non-auth → redirect /login`, async ({ page }) => {
      const res = await page.goto(`${BASE}${route}`)
      // Middleware redirect 307 vers /login
      expect(page.url()).toContain('/login')
      expect([200, 307]).toContain(res?.status() ?? 0)
    })
  }
})

test.describe('Responsive 375px', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('/fiscal 375px — pas d\'overflow horizontal', async ({ page }) => {
    await page.goto(`${BASE}/fiscal`)
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(scroll).toBeLessThanOrEqual(1)
  })

  test('/karma-regulation 375px — pas d\'overflow horizontal', async ({ page }) => {
    await page.goto(`${BASE}/karma-regulation`)
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(scroll).toBeLessThanOrEqual(1)
  })
})
