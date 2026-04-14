import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const BodySchema = z.object({
  ritual_id: z.string().uuid(),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })

  const admin = createServiceClient()

  const { data: ritual, error: rErr } = await admin
    .from('rituals')
    .select('id, status, reward_vida_credits, participants_count')
    .eq('id', parsed.data.ritual_id)
    .single()
  if (rErr || !ritual) return NextResponse.json({ error: 'Rituel introuvable.' }, { status: 404 })
  if (ritual.status === 'completed') {
    return NextResponse.json({ error: 'Ce rituel est déjà terminé.' }, { status: 400 })
  }

  const { data: existing } = await admin
    .from('ritual_participations')
    .select('id, completed')
    .eq('ritual_id', ritual.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, already: true })
  }

  const { error: insErr } = await admin.from('ritual_participations').insert({
    ritual_id: ritual.id,
    user_id: user.id,
    reward_vida_credits: ritual.reward_vida_credits,
  })
  if (insErr) return NextResponse.json({ error: 'Inscription impossible.' }, { status: 500 })

  await admin
    .from('rituals')
    .update({ participants_count: (ritual.participants_count ?? 0) + 1 })
    .eq('id', ritual.id)

  await admin.from('notifications').insert({
    user_id: user.id,
    type: 'ritual',
    title: 'Rituel rejoint',
    body: 'Ta présence est précieuse. Rendez-vous à l’heure du rituel ✨',
    icon: '🌙',
    action_url: '/dashboard/rituels',
  })

  return NextResponse.json({ ok: true })
}
