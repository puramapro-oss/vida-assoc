import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Vercel Cron — quotidien 04:00 UTC.
 * Débloque les prime_allocations pending dont unlockable_at <= now()
 * et crédite le wallet_balance du user.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const nowIso = new Date().toISOString()

  const { data: pending, error } = await service
    .from('prime_allocations')
    .select('id, user_id, amount_cents')
    .eq('status', 'pending')
    .lte('unlockable_at', nowIso)
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let unlocked = 0
  for (const p of pending ?? []) {
    await service.from('prime_allocations').update({
      status: 'unlocked',
      unlocked_at: nowIso,
    }).eq('id', p.id)

    // Crédite wallet_balance du profile (wallet_balance en euros float)
    const { data: profile } = await service
      .from('profiles')
      .select('wallet_balance')
      .eq('id', p.user_id)
      .maybeSingle()
    const current = Number(profile?.wallet_balance ?? 0)
    await service.from('profiles').update({
      wallet_balance: current + p.amount_cents / 100,
    }).eq('id', p.user_id)

    await service.from('wallet_transactions').insert({
      user_id: p.user_id,
      amount_cents: p.amount_cents,
      type: 'prime_unlock',
      description: 'Prime de bienvenue débloquée (30 jours anti-fraude terminés)',
    })

    await service.from('notifications').insert({
      user_id: p.user_id,
      type: 'reward',
      title: 'Prime débloquée 🎁',
      body: `Ta prime de ${(p.amount_cents / 100).toFixed(2)}€ est maintenant disponible dans ton wallet.`,
      read: false,
    })

    unlocked++
  }

  return NextResponse.json({ ok: true, unlocked_count: unlocked, checked_at: nowIso })
}
