import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Vercel Cron — dimanche 23:59 UTC.
 * Tirage hebdomadaire KARMA : 10 gagnants parmi les participants actifs,
 * redistribue la cagnotte (hebdo).
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - 7)

  // Participants actifs cette semaine
  const { data: eligible } = await service
    .from('karma_plays')
    .select('user_id')
    .eq('game_slug', 'tirage_hebdo')
    .gte('played_at', weekStart.toISOString())

  const participants = Array.from(new Set((eligible ?? []).map((e) => e.user_id)))
  if (participants.length === 0) {
    return NextResponse.json({ ok: true, winners: 0, reason: 'no participants' })
  }

  // Cagnotte hebdo
  const { data: cagnotte } = await service
    .from('karma_cagnotte')
    .select('*')
    .eq('period_type', 'weekly')
    .eq('status', 'active')
    .maybeSingle()

  const poolCents = cagnotte?.total_cents ?? 0
  const winnersCount = Math.min(10, participants.length)
  const perWinner = Math.floor(poolCents / winnersCount)

  // Tirage (Fisher-Yates partiel)
  const shuffled = [...participants]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const winners = shuffled.slice(0, winnersCount)

  // Redistribue
  for (const userId of winners) {
    if (perWinner > 0) {
      await service.from('wallet_transactions').insert({
        user_id: userId,
        amount_cents: perWinner,
        type: 'karma_weekly_prize',
        description: `Gain tirage KARMA hebdomadaire (${weekStart.toISOString().slice(0, 10)} → ${now.toISOString().slice(0, 10)})`,
      })
      const { data: profile } = await service.from('profiles').select('wallet_balance').eq('id', userId).maybeSingle()
      const current = Number(profile?.wallet_balance ?? 0)
      await service.from('profiles').update({
        wallet_balance: current + perWinner / 100,
      }).eq('id', userId)
    }
    await service.from('karma_plays').insert({
      user_id: userId,
      game_slug: 'tirage_hebdo',
      tickets_used: 0,
      outcome: 'won',
      prize_cents: perWinner,
      prize_points: 0,
    })
    await service.from('notifications').insert({
      user_id: userId,
      type: 'reward',
      title: '🎰 Gagné au tirage KARMA !',
      body: `Tu viens de gagner ${(perWinner / 100).toFixed(2)}€ au tirage hebdomadaire. Merci pour ta présence.`,
      read: false,
    })
  }

  // Close current cagnotte + ouvre la suivante
  if (cagnotte) {
    await service.from('karma_cagnotte').update({
      status: 'closed',
      distributed_cents: perWinner * winnersCount,
    }).eq('id', cagnotte.id)
  }
  const nextStart = new Date(now)
  const nextEnd = new Date(now)
  nextEnd.setUTCDate(now.getUTCDate() + 7)
  await service.from('karma_cagnotte').insert({
    period_type: 'weekly',
    period_start: nextStart.toISOString().slice(0, 10),
    period_end: nextEnd.toISOString().slice(0, 10),
    total_cents: 0,
    status: 'active',
  })

  return NextResponse.json({
    ok: true,
    winners_count: winnersCount,
    prize_per_winner_cents: perWinner,
    pool_distributed_cents: perWinner * winnersCount,
  })
}
