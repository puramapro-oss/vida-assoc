import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'

// Disposable PostgreSQL via PGlite, without any provider or network connection.
// PGLITE_MODULE_PATH can reuse an existing test runtime instead of installing another copy.
const loadPackage = createRequire(import.meta.url)
const { PGlite } = loadPackage(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite')
const db = new PGlite()
const project = fileURLToPath(new URL('../', import.meta.url))
const schema = fs.readFileSync(path.join(project, 'schema.sql'), 'utf8')
const migration = fs.readFileSync(path.join(project, 'migrations/20261122_mission_submission_guard.sql'), 'utf8')
const table = schema.match(/CREATE TABLE IF NOT EXISTS vida_assoc\.mission_completions \([\s\S]*?\n\);/)?.[0]
const bootstrapPolicy = schema.match(/CREATE POLICY completions_insert_own[^;]*;/)?.[0]
assert.ok(table && bootstrapPolicy, 'Expected canonical completion table and insertion policy')
const user = '20000000-0000-4000-8000-000000000001'
const otherUser = '20000000-0000-4000-8000-000000000002'
const mission = '10000000-0000-4000-8000-000000000001'
const historyMission = '10000000-0000-4000-8000-000000000002'
async function sql(...statements) {
  for (const statement of statements) await db.exec(statement)
}

const literal = (value) => `'${String(value).replaceAll("'", "''")}'`
async function asUser(statement, actor = user, role = 'vida_mission_submitter') {
  await db.exec('BEGIN;')
  try {
    await sql(`SET LOCAL ROLE ${role};`,
      `SELECT set_config('request.jwt.claim.sub', ${literal(actor)}, true);`, statement)
  } finally {
    await db.exec('ROLLBACK;')
  }
}

function insert(extra = '') {
  return `INSERT INTO vida_assoc.mission_completions (mission_id, user_id${extra ? ', ' + extra.split('=')[0] : ''})
    VALUES ('${mission}', '${user}'${extra ? ', ' + extra.substring(extra.indexOf('=') + 1) : ''})`
}

function denied(statement, actor = user) {
  return asUser(`DO $$ BEGIN
    BEGIN
      ${statement};
      RAISE EXCEPTION 'Expected row policy rejection';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
  END $$;`, actor)
}

before(async () => {
  await sql('CREATE SCHEMA auth;', 'CREATE SCHEMA vida_assoc;',
    'CREATE ROLE vida_mission_submitter NOLOGIN;',
    'CREATE ROLE vida_mission_reviewer NOLOGIN BYPASSRLS;',
    `CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`,
    'CREATE TABLE vida_assoc.profiles (id uuid PRIMARY KEY);',
    'CREATE TABLE vida_assoc.missions (id uuid PRIMARY KEY);', table,
    `INSERT INTO vida_assoc.profiles VALUES ('${user}'), ('${otherUser}');`,
    `INSERT INTO vida_assoc.missions VALUES ('${mission}'), ('${historyMission}');`,
    'ALTER TABLE vida_assoc.mission_completions ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY completions_read_own ON vida_assoc.mission_completions FOR SELECT USING (user_id = auth.uid());',
    'CREATE POLICY completions_insert_own ON vida_assoc.mission_completions FOR INSERT WITH CHECK (user_id = auth.uid());',
    'GRANT USAGE ON SCHEMA vida_assoc, auth TO vida_mission_submitter, vida_mission_reviewer;',
    'GRANT ALL ON vida_assoc.mission_completions TO vida_mission_submitter, vida_mission_reviewer;',
    `INSERT INTO vida_assoc.mission_completions (mission_id, user_id, status, reward_paid, ai_validation_score)
      VALUES ('${historyMission}', '${user}', 'validated', true, 0.95);`)
  await sql(migration)
  await sql(migration)
})

after(async () => db.close())

test('the migration can be reapplied without changing historical completion rows', async () => {
  await sql(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM vida_assoc.mission_completions
      WHERE mission_id = '${historyMission}' AND user_id = '${user}'
      AND status = 'validated' AND reward_paid = true AND ai_validation_score = 0.95) THEN
      RAISE EXCEPTION 'Historical completion changed';
    END IF;
  END $$;`)
})

test('a non-superuser can still submit pending unpaid evidence', async () => {
  await asUser(`DO $$ DECLARE saved vida_assoc.mission_completions%ROWTYPE; BEGIN
    IF current_setting('is_superuser') <> 'off' THEN RAISE EXCEPTION 'Invalid privileged fixture'; END IF;
    ${insert()} RETURNING * INTO saved;
    IF saved.status <> 'pending' OR saved.reward_paid OR saved.ai_validation_score IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid submission state';
    END IF;
  END $$;`)
})

for (const forbidden of [
  "status='validated'", "status='rejected'", "status='disputed'", 'reward_paid=true',
  "reward_paid_at='2026-11-22T00:00:00Z'", "validated_at='2026-11-22T00:00:00Z'",
  `reviewed_by='${otherUser}'`, 'ai_validation_score=0.95', "ai_validation_notes='Forged validation'",
]) {
  test(`a client cannot submit a trusted field: ${forbidden}`, () => denied(insert(forbidden)))
}

test('another user cannot submit on behalf of the owner', () => denied(insert(), otherUser))
test('a caller without a user identity cannot submit evidence', () => denied(insert(), ''))

test('the database uniqueness constraint still rejects repeated submissions', async () => {
  await asUser(`DO $$ BEGIN
    ${insert()};
    BEGIN
      ${insert()};
      RAISE EXCEPTION 'Expected unique violation';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  END $$;`)
})

test('a client cannot change a submitted proof into a validation', async () => {
  await asUser(`DO $$ DECLARE changed integer; BEGIN
    ${insert()};
    UPDATE vida_assoc.mission_completions SET status = 'validated', reward_paid = true WHERE mission_id = '${mission}';
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 0 THEN RAISE EXCEPTION 'Client changed trusted review state'; END IF;
  END $$;`)
})

test('a trusted server role retains its existing review permissions', async () => {
  await asUser(`DO $$ DECLARE changed integer; BEGIN
    UPDATE vida_assoc.mission_completions SET status = 'pending', reward_paid = false WHERE mission_id = '${historyMission}';
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN RAISE EXCEPTION 'Server review path unexpectedly blocked'; END IF;
  END $$;`, user, 'vida_mission_reviewer')
})

test('the canonical bootstrap policy and the migration have identical checks', async () => {
  await sql('BEGIN;', `CREATE TEMP TABLE previous_policy AS
    SELECT pg_get_expr(polwithcheck, polrelid) AS expression FROM pg_policy
    WHERE polname = 'completions_insert_own' AND polrelid = 'vida_assoc.mission_completions'::regclass;`,
  'DROP POLICY completions_insert_own ON vida_assoc.mission_completions;', bootstrapPolicy,
  `DO $$ BEGIN
    IF (SELECT expression FROM previous_policy) IS DISTINCT FROM
      (SELECT pg_get_expr(polwithcheck, polrelid) FROM pg_policy
       WHERE polname = 'completions_insert_own' AND polrelid = 'vida_assoc.mission_completions'::regclass) THEN
      RAISE EXCEPTION 'Bootstrap and migration checks differ';
    END IF;
  END $$;`, 'ROLLBACK;')
})
