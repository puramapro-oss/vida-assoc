import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { sha256, stampHash } from '@/lib/opentimestamps'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 60

const Body = z.object({
  kind: z.enum(['karma_game', 'contest', 'general']),
  game_slug: z.string().optional(),
  title: z.string().min(3).max(200),
  version: z.string().default('v1'),
  content: z.string().min(50).max(50000),
})

/**
 * POST /api/karma/stamp — super_admin uniquement.
 * Hash + stamp OpenTimestamps + insert dans regulations.
 * Proof stocké dans bucket Supabase Storage `regulation-proofs`.
 */
export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })

  const contentHash = sha256(parsed.data.content)

  let proofUrl: string | null = null
  try {
    const proofBuffer = await stampHash(contentHash)
    // Upload .ots proof to storage
    const service = createServiceClient()
    const fileName = `regulation-${parsed.data.kind}-${contentHash.slice(0, 12)}-${Date.now()}.ots`
    const { error: uploadError } = await service.storage
      .from('regulation-proofs')
      .upload(fileName, proofBuffer, { contentType: 'application/octet-stream', upsert: false })
    if (!uploadError) {
      const { data: urlData } = service.storage.from('regulation-proofs').getPublicUrl(fileName)
      proofUrl = urlData?.publicUrl ?? null
    }
  } catch (e) {
    // Le stamp a échoué (calendar servers offline) — on insert quand même
    // le règlement avec le hash, le stamp sera re-tenté par un cron ultérieur.
    const msg = e instanceof Error ? e.message : 'stamp failed'
    return NextResponse.json({ error: `OpenTimestamps indisponible : ${msg}` }, { status: 503 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('regulations')
    .insert({
      kind: parsed.data.kind,
      game_slug: parsed.data.game_slug ?? null,
      title: parsed.data.title,
      version: parsed.data.version,
      content: parsed.data.content,
      content_sha256: contentHash,
      ots_proof_url: proofUrl,
      ots_proof_verified: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    ok: true,
    regulation_id: data.id,
    content_sha256: contentHash,
    ots_proof_url: proofUrl,
    verify_at: 'https://opentimestamps.org/',
  })
}

export async function GET() {
  const service = createServiceClient()
  const { data } = await service
    .from('regulations')
    .select('id, kind, game_slug, title, version, content_sha256, ots_proof_url, ots_proof_verified, published_at')
    .order('published_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ regulations: data ?? [] })
}
