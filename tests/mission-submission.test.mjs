import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'
import { z } from 'zod'
import { NextResponse } from 'next/server.js'

const routePath = fileURLToPath(new URL('../src/app/api/missions/[id]/complete/route.ts', import.meta.url))
const missionId = '10000000-0000-4000-8000-000000000001'
const userId = '20000000-0000-4000-8000-000000000001'

function loadRoute(options = {}) {
  const calls = { inserts: [], serviceClients: 0, serviceWrites: [], reads: [] }
  const mission = {
    id: missionId, status: 'active', proof_required: true, verification_method: 'photo',
    reward_vida_credits: 20, reward_amount_cents: 200, reward_contest_tickets: 1,
    current_participants: 0, ...options.mission,
  }
  function query(table, service = false) {
    let inserted
    const result = () => {
      if (inserted) {
        return { data: options.insertMissing ? null : { id: 'completion-1', ...inserted }, error: options.insertError ?? null }
      }
      if (table === 'missions') return { data: options.missingMission ? null : mission, error: options.missionError ?? null }
      if (table === 'mission_completions') return { data: options.existing ?? null, error: options.existingError ?? null }
      if (table === 'profiles') return { data: { wallet_balance_cents: 100, vida_credits: 50 }, error: null }
      throw new Error(`Unexpected table: ${table}`)
    }
    const chain = {
      select() { return chain },
      eq() { return chain },
      maybeSingle() { calls.reads.push(table); return Promise.resolve(result()) },
      single() { return Promise.resolve(result()) },
      insert(value) { inserted = value; calls.inserts.push({ table, value }); return chain },
      update(value) {
        assert.ok(service, 'Submission unexpectedly updates a user-scoped table')
        calls.serviceWrites.push({ table, value })
        return chain
      },
      then(resolve, reject) {
        return Promise.resolve({ data: null, error: options.rewardWriteError ?? null }).then(resolve, reject)
      },
    }
    return chain
  }
  const supabase = {
    auth: { getUser: async () => ({ data: { user: options.anonymous ? null : { id: userId } } }) },
    from: (table) => query(table),
  }
  const imports = {
    'next/server': { NextResponse },
    zod: { z },
    '@/lib/supabase-server': { createServerSupabaseClient: async () => supabase },
    '@/lib/supabase': {
      createServiceClient: () => {
        calls.serviceClients += 1
        return { from: (table) => query(table, true) }
      },
    },
  }
  const compiledModule = { exports: {} }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(routePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: routePath,
  }).outputText, {
    module: compiledModule, exports: compiledModule.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`)
      return imports[name]
    },
  }, { filename: routePath })
  return {
    calls,
    async submit(body = { proof_photo_url: `${userId}/${missionId}-proof.jpg` }) {
      const request = new Request(`https://vida-assoc.example/api/missions/${missionId}/complete`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
      const response = await compiledModule.exports.POST(request, { params: Promise.resolve({ id: missionId }) })
      return { status: response.status, body: await response.json() }
    },
  }
}

test('a photo storage key is a submitted proof, never a completed validation or payment', async () => {
  const route = loadRoute()
  const response = await route.submit()
  assert.equal(response.status, 200)
  assert.equal(response.body.completion.status, 'pending')
  assert.equal(response.body.completion.reward_paid, false)
  assert.equal(response.body.completion.validated_at, null)
  assert.equal(response.body.completion.reward_paid_at, null)
  assert.equal(response.body.completion.ai_validation_score, null)
  assert.equal(response.body.completion.human_review_needed, true)
  assert.equal(route.calls.serviceClients, 0)
})

for (const verification of ['photo', 'video', 'photo_before_after', 'gps', 'ai_auto', 'mutual_confirmation', 'exif', 'qr', 'health']) {
  test(`${verification}: submitted photo and coordinates are not independently verified evidence`, async () => {
    const route = loadRoute({ mission: { verification_method: verification } })
    const response = await route.submit({ proof_photo_url: 'unverified-claim', proof_gps_lat: 46, proof_gps_lng: 6 })
    assert.equal(response.status, 200)
    assert.equal(response.body.completion.status, 'pending')
    assert.equal(response.body.completion.reward_paid, false)
    assert.equal(response.body.completion.ai_validation_score, null)
    assert.equal(route.calls.serviceWrites.length, 0)
  })
}

test('submission cannot falsely report payment even when a reward database write would fail', async () => {
  const route = loadRoute({ rewardWriteError: { code: 'XX000', message: 'Synthetic reward write failure' } })
  const response = await route.submit()
  assert.equal(response.status, 200)
  assert.equal(response.body.completion.reward_paid, false)
  assert.equal(route.calls.serviceWrites.length, 0)
})

test('an optional proof also carries no fabricated AI score or validation claim', async () => {
  const route = loadRoute({ mission: { proof_required: false } })
  const response = await route.submit({ proof_text: 'Submission for review' })
  assert.equal(response.status, 200)
  assert.equal(response.body.completion.ai_validation_score, null)
  assert.equal(response.body.completion.ai_validation_notes, null)
  assert.equal(response.body.completion.status, 'pending')
})

test('an unauthenticated submission is rejected without database writes', async () => {
  const route = loadRoute({ anonymous: true })
  assert.equal((await route.submit()).status, 401)
  assert.equal(route.calls.inserts.length, 0)
})

test('inactive and missing missions reject submissions', async () => {
  for (const [options, expected] of [[{ mission: { status: 'expired' } }, 410], [{ missingMission: true }, 404]]) {
    const route = loadRoute(options)
    assert.equal((await route.submit()).status, expected)
    assert.equal(route.calls.inserts.length, 0)
  }
})

test('required evidence is still required', async () => {
  const route = loadRoute()
  assert.equal((await route.submit({ proof_text: 'No photo' })).status, 400)
  assert.equal(route.calls.inserts.length, 0)
})

test('the existing mutual-confirmation path can submit text for later review', async () => {
  const route = loadRoute({ mission: { verification_method: 'mutual_confirmation' } })
  const response = await route.submit({ proof_text: 'Waiting for the other participant' })
  assert.equal(response.status, 200)
  assert.equal(response.body.completion.status, 'pending')
  assert.equal(response.body.completion.ai_validation_score, null)
})

test('an existing completion is preserved and never credited again', async () => {
  const route = loadRoute({ existing: { id: 'existing-completion' } })
  assert.equal((await route.submit()).status, 409)
  assert.equal(route.calls.inserts.length, 0)
  assert.equal(route.calls.serviceClients, 0)
})

test('a failed duplicate lookup fails explicitly before any insert', async () => {
  const route = loadRoute({ existingError: { code: '08006', message: 'Internal database endpoint unavailable' } })
  const response = await route.submit()
  assert.equal(response.status, 503)
  assert.equal(route.calls.inserts.length, 0)
  assert.doesNotMatch(response.body.error, /Internal database/)
})

test('a concurrent duplicate remains a conflict rather than an unexplained failure', async () => {
  const route = loadRoute({ insertError: { code: '23505', message: 'Internal unique constraint information' } })
  const response = await route.submit()
  assert.equal(response.status, 409)
  assert.doesNotMatch(response.body.error, /Internal unique/)
  assert.equal(route.calls.serviceClients, 0)
})

test('a failed insert cannot be reported as a successful submission or expose internal details', async () => {
  const route = loadRoute({ insertError: { code: '08006', message: 'Internal database endpoint unavailable' } })
  const response = await route.submit()
  assert.equal(response.status, 500)
  assert.equal(response.body.ok, undefined)
  assert.doesNotMatch(response.body.error, /Internal database/)
  assert.equal(route.calls.serviceClients, 0)
})

test('a missing inserted record is an explicit failure', async () => {
  const route = loadRoute({ insertMissing: true, mission: { proof_required: false } })
  const response = await route.submit({})
  assert.equal(response.status, 500)
  assert.equal(response.body.ok, undefined)
})

test('malformed JSON is rejected even when photo evidence is optional', async () => {
  const route = loadRoute({ mission: { proof_required: false } })
  assert.equal((await route.submit('{')).status, 400)
  assert.equal(route.calls.inserts.length, 0)
})

test('whitespace does not satisfy a required photo', async () => {
  const route = loadRoute()
  assert.equal((await route.submit({ proof_photo_url: '   ' })).status, 400)
  assert.equal(route.calls.inserts.length, 0)
})
