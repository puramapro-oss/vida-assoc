import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { APP_SLUG } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 15

// ── Gift type definitions ────────────────────────────────────────────────────

export type GiftType =
  | 'points_small'
  | 'coupon_5'
  | 'coupon_10'
  | 'ticket'
  | 'credits'
  | 'coupon_20'
  | 'points_mega'
  | 'coupon_50'

interface GiftConfig {
  type: GiftType
  label: string
  value: string
  points?: number
  credits?: number
  tickets?: number
  coupon_discount?: number
  coupon_days?: number
}

// Cumulative probability table (must sum to 100)
const GIFT_POOL: Array<{ weight: number; config: GiftConfig }> = [
  {
    weight: 40,
    config: {
      type: 'points_small',
      label: 'Crédits Sangha',
      value: '5–20 crédits',
    },
  },
  {
    weight: 12,
    config: {
      type: 'coupon_5',
      label: 'Coupon -5%',
      value: '-5% pendant 7 jours',
      coupon_discount: 5,
      coupon_days: 7,
    },
  },
  {
    weight: 13,
    config: {
      type: 'coupon_10',
      label: 'Coupon -10%',
      value: '-10% pendant 7 jours',
      coupon_discount: 10,
      coupon_days: 7,
    },
  },
  {
    weight: 15,
    config: {
      type: 'ticket',
      label: 'Ticket concours',
      value: '1 ticket',
      tickets: 1,
    },
  },
  {
    weight: 10,
    config: {
      type: 'credits',
      label: '+3 crédits bonus',
      value: '+3 crédits',
      credits: 3,
    },
  },
  {
    weight: 5,
    config: {
      type: 'coupon_20',
      label: 'Coupon -20%',
      value: '-20% pendant 3 jours',
      coupon_discount: 20,
      coupon_days: 3,
    },
  },
  {
    weight: 3,
    config: {
      type: 'points_mega',
      label: 'Mega crédits Sangha',
      value: '50–100 crédits',
    },
  },
  {
    weight: 2,
    config: {
      type: 'coupon_50',
      label: 'Coupon -50% FLASH',
      value: '-50% pendant 24h',
      coupon_discount: 50,
      coupon_days: 1,
    },
  },
]

function pickGift(): GiftConfig & { points_earned: number } {
  const roll = Math.random() * 100
  let cumulative = 0
  let chosen = GIFT_POOL[0].config

  for (const entry of GIFT_POOL) {
    cumulative += entry.weight
    if (roll < cumulative) {
      chosen = entry.config
      break
    }
  }

  let points_earned = 0

  if (chosen.type === 'points_small') {
    points_earned = 5 + Math.floor(Math.random() * 16) // 5–20
  } else if (chosen.type === 'points_mega') {
    points_earned = 50 + Math.floor(Math.random() * 51) // 50–100
  }

  return { ...chosen, points_earned }
}

// ── Streak calculator ────────────────────────────────────────────────────────

async function calcStreak(
  serviceClient: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<number> {
  const { data } = await serviceClient
    .from('daily_gifts')
    .select('opened_at')
    .eq('user_id', userId)
    .eq('app_slug', APP_SLUG)
    .order('opened_at', { ascending: false })
    .limit(100)

  if (!data || data.length === 0) return 0

  // Collect unique dates (YYYY-MM-DD) in descending order
  const dates = [
    ...new Set(
      (data as { opened_at: string }[]).map((r) =>
        new Date(r.opened_at).toISOString().slice(0, 10)
      )
    ),
  ].sort((a, b) => (a < b ? 1 : -1))

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10)

  // Streak must include today or yesterday to be considered active
  if (dates[0] !== today && dates[0] !== yesterday) return 0

  let streak = 0
  let expected = dates[0]

  for (const d of dates) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toISOString().slice(0, 10)
    } else {
      break
    }
  }

  return streak
}

// ── GET — check status ───────────────────────────────────────────────────────

export async function GET() {
  const authClient = await createServerSupabaseClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  const service = createServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: existing } = await service
    .from('daily_gifts')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', APP_SLUG)
    .gte('opened_at', todayStart.toISOString())
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const streak = await calcStreak(service, user.id)

  return NextResponse.json({
    opened: !!existing,
    gift: existing ?? null,
    streak,
  })
}

// ── POST — open gift ─────────────────────────────────────────────────────────

export async function POST() {
  const authClient = await createServerSupabaseClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  const service = createServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Idempotency: check already opened today
  const { data: existing } = await service
    .from('daily_gifts')
    .select('id')
    .eq('user_id', user.id)
    .eq('app_slug', APP_SLUG)
    .gte('opened_at', todayStart.toISOString())
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Coffre déjà ouvert aujourd\'hui. Reviens demain !' },
      { status: 409 }
    )
  }

  const streak = await calcStreak(service, user.id)
  const gift = pickGift()

  // Streak-7 bonus: guarantee at least -10% coupon (bump small points to coupon_10)
  const effectiveGift =
    streak > 0 && streak % 7 === 0 && gift.type === 'points_small'
      ? {
          ...gift,
          type: 'coupon_10' as GiftType,
          label: 'Coupon -10% (bonus streak 7j)',
          value: '-10% pendant 7 jours',
          coupon_discount: 10,
          coupon_days: 7,
          points_earned: 0,
        }
      : gift

  // Compute coupon expiry
  const couponExpiresAt = effectiveGift.coupon_days
    ? new Date(
        Date.now() + effectiveGift.coupon_days * 86400_000
      ).toISOString()
    : null

  const { data: row, error } = await service
    .from('daily_gifts')
    .insert({
      user_id: user.id,
      app_slug: APP_SLUG,
      gift_type: effectiveGift.type,
      gift_label: effectiveGift.label,
      gift_value: effectiveGift.value,
      points_earned: effectiveGift.points_earned,
      credits_earned: effectiveGift.credits ?? 0,
      tickets_earned: effectiveGift.tickets ?? 0,
      coupon_discount: effectiveGift.coupon_discount ?? null,
      coupon_days: effectiveGift.coupon_days ?? null,
      coupon_expires_at: couponExpiresAt,
      streak_count: streak + 1,
      opened_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[daily-gift] insert error', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ouverture du coffre. Réessaie dans quelques secondes.' },
      { status: 500 }
    )
  }

  // Apply rewards to profile
  const updates: Record<string, unknown> = {}
  if (effectiveGift.points_earned > 0) updates.vida_credits = effectiveGift.points_earned
  if (effectiveGift.credits) updates.vida_credits = (updates.vida_credits as number ?? 0) + effectiveGift.credits
  if (effectiveGift.tickets) updates.contest_tickets = effectiveGift.tickets

  if (Object.keys(updates).length > 0) {
    // Use RPC to increment atomically
    try {
      if (updates.vida_credits) {
        await service.rpc('increment_vida_credits', {
          p_user_id: user.id,
          p_amount: updates.vida_credits as number,
        })
      }
    } catch { /* best-effort; if RPC missing, skip */ }
    try {
      if (updates.contest_tickets) {
        await service.rpc('increment_contest_tickets', {
          p_user_id: user.id,
          p_amount: updates.contest_tickets as number,
        })
      }
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ gift: row }, { status: 201 })
}
