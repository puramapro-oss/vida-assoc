import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 10

const POST_TYPES = ['text', 'photo', 'video', 'mission', 'victory', 'question', 'gratitude'] as const

const BodySchema = z.object({
  content: z.string().trim().min(2, 'Écris quelques mots.').max(2000, 'Message trop long.'),
  type: z.enum(POST_TYPES).default('text'),
  media_url: z.string().trim().url().max(500).optional().or(z.literal('')),
  mission_id: z.string().uuid().optional(),
})

// Ultra-light FR profanity / toxicity pass. Upgrade to Claude moderation in P6.
const BLOCKED = [
  'connard', 'connasse', 'pute', 'salope', 'fdp', 'ntm', 'enculé', 'encule',
  'nègre', 'bougnoule', 'pédé', 'pede', 'tapette', 'bâtard', 'batard',
  'tue-toi', 'suicide-toi',
]

function isToxic(text: string): boolean {
  const low = text.toLowerCase()
  return BLOCKED.some((w) => low.includes(w))
}

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 })
  }
  if (isToxic(parsed.data.content)) {
    return NextResponse.json(
      {
        error:
          'Ce message contient des mots blessants. Sangha est un espace d’amour — réécris-le avec douceur.',
      },
      { status: 422 },
    )
  }

  const admin = createServiceClient()

  // Simple rate limit : 5 posts / 15 min
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('community_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gt('created_at', fifteenMinAgo)

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Tu publies très vite — pose-toi 15 minutes puis reviens.' },
      { status: 429 },
    )
  }

  const { data, error } = await admin
    .from('community_posts')
    .insert({
      user_id: user.id,
      content: parsed.data.content,
      type: parsed.data.type,
      media_url: parsed.data.media_url && parsed.data.media_url !== '' ? parsed.data.media_url : null,
      mission_id: parsed.data.mission_id ?? null,
    })
    .select('id, user_id, content, type, media_url, mission_id, likes_count, comments_count, hidden, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Publication impossible.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, post: data })
}
