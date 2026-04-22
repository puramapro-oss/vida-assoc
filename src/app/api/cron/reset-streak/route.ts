import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * Vercel Cron — quotidien 00:01 UTC.
 * Reset les streaks des users qui n'ont aucune activité depuis 48h.
 * Une activité = mission_completion / gratitude_entry / breath_session /
 * community_post / ritual_participation / karma_play aujourd'hui.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: stale } = await service
    .from('engagement_state')
    .select('user_id, streak_days, streak_best')
    .lt('last_activity_at', cutoff)
    .gt('streak_days', 0)

  let resetCount = 0
  for (const s of stale ?? []) {
    await service
      .from('engagement_state')
      .update({
        streak_days: 0,
        multiplier: 1.0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', s.user_id)
    resetCount++
  }

  return NextResponse.json({ ok: true, reset_count: resetCount })
}
