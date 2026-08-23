#!/usr/bin/env node
/**
 * Publication règlement KARMA v1.0 via service role.
 * Bypass l'API route (qui requiert session super_admin) en exécutant
 * directement la logique : SHA-256 → OpenTimestamps stamp → upload bucket → insert regulation.
 *
 * Usage : node scripts/stamp-regulation.mjs docs/karma-regulation-v1.md
 */

import 'dotenv/config'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import ots from 'javascript-opentimestamps'

const [, , inputPath = 'docs/karma-regulation-v1.md'] = process.argv

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const content = fs.readFileSync(inputPath, 'utf-8')
const sha256 = crypto.createHash('sha256').update(content, 'utf-8').digest('hex')
console.warn(`SHA-256: ${sha256}`)

// Stamp OpenTimestamps
console.warn('Stamping to OpenTimestamps calendar servers…')
const hashBuffer = Buffer.from(sha256, 'hex')
const detached = ots.DetachedTimestampFile.fromHash(new ots.Ops.OpSHA256(), hashBuffer)
await ots.stamp(detached)
const proofBuffer = Buffer.from(detached.serializeToBytes())
console.warn(`Proof size: ${proofBuffer.length} bytes`)

// Upload proof to bucket
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  db: { schema: 'vida_assoc' },
  auth: { persistSession: false },
})

const fileName = `regulation-karma-${sha256.slice(0, 12)}-${Date.now()}.ots`
console.warn(`Uploading to regulation-proofs/${fileName}…`)
const { error: upErr } = await supabase.storage
  .from('regulation-proofs')
  .upload(fileName, proofBuffer, { contentType: 'application/octet-stream', upsert: false })
if (upErr) {
  console.error('Upload error:', upErr.message)
  process.exit(1)
}
const { data: urlData } = supabase.storage.from('regulation-proofs').getPublicUrl(fileName)
const proofUrl = urlData.publicUrl
console.warn(`Proof URL: ${proofUrl}`)

// Insert regulation row
const { data: row, error: insErr } = await supabase
  .from('regulations')
  .insert({
    kind: 'karma_game',
    game_slug: null,
    title: 'Règlement des jeux KARMA — Sangha',
    version: 'v1.0',
    content,
    content_sha256: sha256,
    ots_proof_url: proofUrl,
    ots_proof_verified: false,
  })
  .select()
  .single()
if (insErr) {
  console.error('Insert error:', insErr.message)
  process.exit(1)
}

console.warn(`\n✓ Regulation published`)
console.warn(`  ID: ${row.id}`)
console.warn(`  Version: ${row.version}`)
console.warn(`  SHA-256: ${row.content_sha256}`)
console.warn(`  OTS proof: ${row.ots_proof_url}`)
console.warn(`  Pending Bitcoin confirmation (~1-6h).`)
console.warn(`  Vérifiable publiquement sur : https://vida-assoc.purama.dev/karma-regulation`)
