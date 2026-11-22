import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'
import { NextRequest, NextResponse } from 'next/server.js'

// Execute the real route with the real Next.js response implementation.
// Only the database/auth boundary is replaced: no provider or account is contacted.
const routePath = fileURLToPath(new URL('../src/app/auth/callback/route.ts', import.meta.url))

function loadRoute({
  authError = null, hasCode = true, legalError = false,
  createError = false, exchangeThrows = false, providerError = null, providerErrorCode = null,
} = {}) {
  const calls = { exchanges: [], legalReads: 0, clientCreations: 0 }
  const supabase = {
    auth: {
      exchangeCodeForSession: async (code) => {
        calls.exchanges.push(code)
        if (exchangeThrows) throw new Error('Synthetic unavailable authentication provider')
        return { data: { session: authError ? null : { user: { id: 'test-user' } } }, error: authError }
      },
      getUser: async () => ({ data: { user: { id: 'test-user' } } }),
    },
    from: () => ({
      select: () => ({
        eq: async () => {
          calls.legalReads += 1
          if (legalError) throw new Error('Synthetic unavailable legal table')
          return { count: 1, error: null }
        },
      }),
    }),
  }
  const output = ts.transpileModule(fs.readFileSync(routePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: routePath,
  }).outputText
  const compiledModule = { exports: {} }
  const imports = {
    'next/server': { NextResponse },
    '@/lib/supabase-server': {
      createServerSupabaseClient: async () => {
        calls.clientCreations += 1
        if (createError) throw new Error('Synthetic unavailable client configuration')
        return supabase
      },
    },
    '@/lib/legal/versions': { CURRENT_LEGAL_VERSIONS: {} },
  }
  vm.runInNewContext(output, {
    exports: compiledModule.exports,
    module: compiledModule,
    URL,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`)
      return imports[name]
    },
  }, { filename: routePath })
  return {
    calls,
    async request(next) {
      const url = new URL('https://vida-assoc.example/auth/callback')
      if (hasCode) url.searchParams.set('code', 'test-code')
      if (next !== null) url.searchParams.set('next', next)
      if (providerError !== null) url.searchParams.set('error', providerError)
      if (providerErrorCode !== null) url.searchParams.set('error_code', providerErrorCode)
      return compiledModule.exports.GET(new NextRequest(url))
    },
  }
}

const origin = 'https://vida-assoc.example'
test('auth redirects cannot be stored by shared caches on success or failure', async () => {
  for (const options of [{}, { hasCode: false }, { authError: new Error('synthetic') }, { exchangeThrows: true }, { providerError: 'access_denied' }]) {
    const response = await loadRoute(options).request('/dashboard')
    assert.match(response.headers.get('cache-control'), /private/)
    assert.match(response.headers.get('cache-control'), /no-store/)
    assert.equal(response.headers.get('expires'), '0')
    assert.equal(response.headers.get('pragma'), 'no-cache')
  }
})
const allowed = [
  [null, '/dashboard'],
  ['/dashboard/settings', '/dashboard/settings'],
  ['/dashboard/missions?sort=recent#details', '/dashboard/missions?sort=recent#details'],
  ['/dashboard/formations/%C3%A9nergie', '/dashboard/formations/%C3%A9nergie'],
  ['/dashboard/../dashboard/profile', '/dashboard/profile'],
]

for (const [input, expected] of allowed) {
  test(`keeps an internal destination: ${JSON.stringify(input)}`, async () => {
    const route = loadRoute()
    const response = await route.request(input)
    assert.equal(response.status, 307)
    assert.equal(response.headers.get('location'), origin + expected)
    assert.deepEqual(route.calls.exchanges, ['test-code'])
  })
}

const rejected = [
  'https://outside.invalid/phishing',
  '//outside.invalid/phishing',
  '/\\outside.invalid/phishing',
  '\\outside.invalid/phishing',
  'javascript:alert(1)',
  'https://vida-assoc.example@outside.invalid/phishing',
  '/\t/outside.invalid/phishing',
  '/\n/outside.invalid/phishing',
  '/dashboard\r/settings',
  '/dashboard\u0000/settings',
  '/dashboard/..//outside.invalid/phishing',
  '/%2e%2e//outside.invalid/phishing',
  '%2F%2Foutside.invalid/phishing',
  '/%5Coutside.invalid/phishing',
  '/%2Foutside.invalid/phishing',
  'http://[::1',
  '',
  'dashboard',
]

for (const input of rejected) {
  test(`falls back safely for a forbidden destination: ${JSON.stringify(input)}`, async () => {
    const route = loadRoute()
    const response = await route.request(input)
    assert.equal(response.status, 307)
    assert.equal(response.headers.get('location'), `${origin}/dashboard`)
  })
}

test('missing code returns to login without exchanging a session', async () => {
  const route = loadRoute({ hasCode: false })
  const response = await route.request('https://outside.invalid')
  assert.equal(response.headers.get('location'), `${origin}/login?error=auth_failed`)
  assert.equal(route.calls.exchanges.length, 0)
  assert.equal(route.calls.legalReads, 0)
})

test('a failed session exchange never redirects to a success destination', async () => {
  const route = loadRoute({ authError: { message: 'Synthetic expired code' } })
  const response = await route.request('/dashboard/settings')
  assert.equal(response.headers.get('location'), `${origin}/login?error=auth_failed`)
  assert.equal(route.calls.legalReads, 0)
})

test('an unavailable legal table preserves the existing best-effort login behavior', async () => {
  const route = loadRoute({ legalError: true })
  const response = await route.request('/dashboard/settings')
  assert.equal(response.headers.get('location'), `${origin}/dashboard/settings`)
})

for (const option of ['createError', 'exchangeThrows']) {
  test(`${option}: an unavailable authentication dependency returns to the login page`, async () => {
    const route = loadRoute({ [option]: true })
    const response = await route.request('/dashboard/settings')
    assert.equal(response.headers.get('location'), `${origin}/login?error=auth_failed`)
    assert.equal(route.calls.legalReads, 0)
  })
}

for (const provider of [{ providerError: 'access_denied' }, { providerErrorCode: 'otp_expired' }]) {
  test(`a provider error cannot be ignored even with a code: ${JSON.stringify(provider)}`, async () => {
    const route = loadRoute(provider)
    const response = await route.request('/dashboard/settings')
    assert.equal(response.headers.get('location'), `${origin}/login?error=auth_failed`)
    assert.equal(route.calls.clientCreations, 0)
    assert.equal(route.calls.exchanges.length, 0)
    assert.equal(route.calls.legalReads, 0)
  })
}
