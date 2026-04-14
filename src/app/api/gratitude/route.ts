import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const PostSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis.').max(1000, 'Maximum 1000 caractères.'),
})

export async function GET() {
  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('gratitude_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Impossible de récupérer tes gratitudes.' }, { status: 500 })
  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = PostSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Check max 3 entries per day
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { count, error: countErr } = await admin
    .from('gratitude_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfDay.toISOString())

  if (countErr) return NextResponse.json({ error: 'Vérification impossible.' }, { status: 500 })
  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Tu as déjà partagé 3 gratitudes aujourd\'hui. Reviens demain 🙏' },
      { status: 429 },
    )
  }

  const { data: entry, error: insErr } = await admin
    .from('gratitude_entries')
    .insert({ user_id: user.id, content: parsed.data.content })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: 'Impossible d\'enregistrer ta gratitude.' }, { status: 500 })

  // Award XP via awakening_events (fire-and-forget, non-blocking)
  void Promise.resolve(
    admin
      .from('awakening_events')
      .insert({ user_id: user.id, event_type: 'gratitude', xp_gained: 15 }),
  ).catch(() => {})

  return NextResponse.json({ ok: true, entry })
}
