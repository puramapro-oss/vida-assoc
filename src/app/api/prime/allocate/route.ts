import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getPhase } from '@/lib/phase'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export const runtime = 'nodejs'

const Body = z.object({
  target_user_id: z.string().uuid().optional(),
  amount_cents: z.number().int().min(100).max(100000),
  source_event: z.enum(['signup', 'subscription_paid', 'referral', 'cpa', 'manual']),
  source_ref: z.string().optional(),
})

/**
 * POST /api/prime/allocate — réservé super_admin ou webhooks internes.
 * Pour les webhooks Stripe, utilise plutôt le handler webhook directement.
 */
export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })

  const isAdmin = user.email === SUPER_ADMIN_EMAIL
  const targetId = parsed.data.target_user_id ?? user.id
  if (!isAdmin && targetId !== user.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const service = createServiceClient()
  const phase = getPhase()
  const unlockable = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const { error } = await service.from('prime_allocations').insert({
    user_id: targetId,
    amount_cents: parsed.data.amount_cents,
    mode: phase,
    source_event: parsed.data.source_event,
    source_ref: parsed.data.source_ref ?? null,
    unlockable_at: unlockable.toISOString(),
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, mode: phase, amount_cents: parsed.data.amount_cents })
}

export async function GET() {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const service = createServiceClient()
  const [stateRes, allocsRes] = await Promise.all([
    service.from('prime_state').select('*').eq('user_id', user.id).maybeSingle(),
    service.from('prime_allocations').select('*').eq('user_id', user.id).order('allocated_at', { ascending: false }).limit(20),
  ])

  return NextResponse.json({
    state: stateRes.data ?? {
      total_allocated_cents: 0,
      total_unlocked_cents: 0,
      total_forfeited_cents: 0,
    },
    allocations: allocsRes.data ?? [],
    phase: getPhase(),
  })
}
