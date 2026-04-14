import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 30

// ──────────────────────────────────────────────
// GET /api/points
// Returns the authenticated user's points balance + last 20 transactions.
// ──────────────────────────────────────────────
export async function GET() {
  const sbUser = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const sbAdmin = createServiceClient()
  const [pointsRes, txRes] = await Promise.all([
    sbAdmin.from('purama_points').select('*').eq('user_id', user.id).single(),
    sbAdmin
      .from('point_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (pointsRes.error && pointsRes.error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Impossible de récupérer tes points.' }, { status: 500 })
  }

  return NextResponse.json({
    points: pointsRes.data ?? null,
    transactions: txRes.data ?? [],
  })
}

// ──────────────────────────────────────────────
// Body schemas
// ──────────────────────────────────────────────
const PurchaseSchema = z.object({
  action: z.literal('purchase'),
  item_id: z.string().uuid('item_id invalide.'),
})

const EarnSchema = z.object({
  action: z.literal('earn'),
  source: z.string().min(1, 'Source requise.').max(100),
  amount: z.number().int().positive('Le montant doit être positif.').max(100_000),
  description: z.string().max(255).optional(),
})

const BodySchema = z.discriminatedUnion('action', [PurchaseSchema, EarnSchema])

// ──────────────────────────────────────────────
// POST /api/points
// action='purchase' : debit points to buy a shop item
// action='earn'     : credit points (internal / server use)
// ──────────────────────────────────────────────
export async function POST(req: Request) {
  // 1. Auth check
  const sbUser = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  // 2. Parse & validate body
  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Données invalides.'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const sbAdmin = createServiceClient()

  // ── PURCHASE ─────────────────────────────────
  if (parsed.data.action === 'purchase') {
    const { item_id } = parsed.data

    // Fetch item
    const { data: item, error: itemErr } = await sbAdmin
      .from('point_shop_items')
      .select('id, name, cost_points')
      .eq('id', item_id)
      .single()

    if (itemErr || !item) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 })
    }

    // Fetch or initialise user points row
    const { data: pointsRow, error: pointsErr } = await sbAdmin
      .from('purama_points')
      .select('balance, lifetime_earned')
      .eq('user_id', user.id)
      .single()

    if (pointsErr && pointsErr.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Impossible de lire ton solde.' }, { status: 500 })
    }

    const currentBalance = (pointsRow?.balance as number | null) ?? 0

    // Check sufficient balance
    if (currentBalance < item.cost_points) {
      return NextResponse.json(
        {
          error: `Solde insuffisant. Il te manque ${(item.cost_points - currentBalance).toLocaleString('fr-FR')} points.`,
        },
        { status: 422 },
      )
    }

    const newBalance = currentBalance - item.cost_points

    // Upsert points row
    const { error: upsertErr } = await sbAdmin.from('purama_points').upsert(
      {
        user_id: user.id,
        balance: newBalance,
        lifetime_earned: pointsRow?.lifetime_earned ?? 0,
      },
      { onConflict: 'user_id' },
    )
    if (upsertErr) {
      return NextResponse.json({ error: 'Mise à jour du solde impossible.' }, { status: 500 })
    }

    // Record transaction
    const { error: txErr } = await sbAdmin.from('point_transactions').insert({
      user_id: user.id,
      amount: -item.cost_points,
      type: 'spend',
      source_app: 'vida-assoc',
      description: `Achat boutique : ${item.name}`,
    })
    if (txErr) {
      // Non-blocking — points already debited, we log but don't fail
      console.error('[points/purchase] transaction insert error:', txErr.message)
    }

    // Record purchase
    const { error: purchaseErr } = await sbAdmin.from('point_purchases').insert({
      user_id: user.id,
      item_id: item.id,
      points_spent: item.cost_points,
    })
    if (purchaseErr) {
      console.error('[points/purchase] point_purchases insert error:', purchaseErr.message)
    }

    return NextResponse.json({ ok: true, balance: newBalance })
  }

  // ── EARN ─────────────────────────────────────
  if (parsed.data.action === 'earn') {
    const { source, amount, description } = parsed.data

    // Fetch or initialise user points row
    const { data: pointsRow, error: pointsErr } = await sbAdmin
      .from('purama_points')
      .select('balance, lifetime_earned')
      .eq('user_id', user.id)
      .single()

    if (pointsErr && pointsErr.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Impossible de lire ton solde.' }, { status: 500 })
    }

    const currentBalance = (pointsRow?.balance as number | null) ?? 0
    const currentLifetime = (pointsRow?.lifetime_earned as number | null) ?? 0
    const newBalance = currentBalance + amount
    const newLifetime = currentLifetime + amount

    // Upsert points row
    const { error: upsertErr } = await sbAdmin.from('purama_points').upsert(
      {
        user_id: user.id,
        balance: newBalance,
        lifetime_earned: newLifetime,
      },
      { onConflict: 'user_id' },
    )
    if (upsertErr) {
      return NextResponse.json({ error: 'Mise à jour du solde impossible.' }, { status: 500 })
    }

    // Record transaction
    const { error: txErr } = await sbAdmin.from('point_transactions').insert({
      user_id: user.id,
      amount,
      type: 'earn',
      source_app: 'vida-assoc',
      description: description ?? source,
      mission_id: null,
    })
    if (txErr) {
      console.error('[points/earn] transaction insert error:', txErr.message)
    }

    return NextResponse.json({ ok: true, balance: newBalance })
  }

  // Should never reach here thanks to discriminated union
  return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
}
