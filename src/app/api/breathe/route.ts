import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const BreathSessionSchema = z.object({
  technique: z.enum(['4-7-8', '4-4-4-4']),
  duration_seconds: z.number().int().min(1).max(3600),
  cycles: z.number().int().min(1).max(100),
})

export async function POST(req: Request) {
  try {
    const sb = await createServerSupabaseClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await sb.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentification requise. Reconnecte-toi pour continuer.' },
        { status: 401 }
      )
    }

    // Zod validation
    const body = await req.json().catch(() => null)
    const parsed = BreathSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Données invalides.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const { technique, duration_seconds, cycles } = parsed.data

    // Insert breath session
    const { error: sessionError } = await sb.from('breath_sessions').insert({
      user_id: user.id,
      technique,
      duration_seconds,
      cycles,
    })

    if (sessionError) {
      console.error('[breathe] insert breath_sessions:', sessionError.message)
      return NextResponse.json(
        { error: 'Impossible d\'enregistrer la séance. Réessaie dans un moment.' },
        { status: 500 }
      )
    }

    // Insert awakening XP event
    const { error: xpError } = await sb.from('awakening_events').insert({
      user_id: user.id,
      event_type: 'breathe',
      xp_gained: 10,
    })

    if (xpError) {
      // Non-blocking — XP failure should not fail the whole request
      console.error('[breathe] insert awakening_events:', xpError.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[breathe] unexpected error:', err)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue. Réessaie plus tard.' },
      { status: 500 }
    )
  }
}
