import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const Body = z.object({
  case_type: z.enum(['etudiant_rural','handicap','mere_isolee','senior','precarite','jeune_majeur','famille_nombreuse']),
  amount_requested_cents: z.number().int().min(1000).max(500000),
  reason: z.string().min(50).max(2000),
  proof_urls: z.array(z.string().url()).max(10).default([]),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.', details: parsed.error.flatten() }, { status: 400 })

  const service = createServiceClient()

  // Limite 1 dossier pending à la fois par user
  const { data: existing } = await service
    .from('bourse_cases')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['pending','reviewing'])
    .maybeSingle()
  if (existing) {
    return NextResponse.json({
      error: 'Un dossier est déjà en cours de traitement.',
      case_id: existing.id,
    }, { status: 409 })
  }

  const { data, error } = await service
    .from('bourse_cases')
    .insert({
      user_id: user.id,
      case_type: parsed.data.case_type,
      amount_requested_cents: parsed.data.amount_requested_cents,
      reason: parsed.data.reason,
      proof_urls: parsed.data.proof_urls,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notif super-admin (async best-effort)
  await service.from('notifications').insert({
    user_id: user.id,
    type: 'system',
    title: 'Dossier Bourse d\'inclusion reçu',
    body: `Ton dossier est en cours d'examen par l'équipe Association PURAMA. Réponse sous 7 jours.`,
    read: false,
  })

  return NextResponse.json({ ok: true, case: data })
}

export async function GET() {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from('bourse_cases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  return NextResponse.json({ cases: data ?? [] })
}
