import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const Body = z.object({
  game_slug: z.string().min(1),
})

/**
 * Tirage karma simplifié :
 *  - consomme N tickets selon game.ticket_cost
 *  - tirage pseudo-random pondéré (30% win baseline, prize variable par jeu)
 *  - crédite gagne en points (Sangha points) ou cents selon jeu
 */
export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })

  const service = createServiceClient()

  const { data: game } = await service
    .from('karma_games')
    .select('*')
    .eq('slug', parsed.data.game_slug)
    .eq('active', true)
    .maybeSingle()
  if (!game) return NextResponse.json({ error: 'Jeu introuvable.' }, { status: 404 })

  // Tickets disponibles (non consommés)
  const { data: tickets } = await service
    .from('karma_tickets')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('consumed', false)

  const totalAvailable = (tickets ?? []).reduce((sum, t) => sum + (t.quantity ?? 0), 0)
  if (totalAvailable < game.ticket_cost) {
    return NextResponse.json({
      error: 'Pas assez de tickets.',
      required: game.ticket_cost,
      available: totalAvailable,
    }, { status: 400 })
  }

  // Consume tickets (FIFO simple)
  let remaining = game.ticket_cost
  for (const t of tickets ?? []) {
    if (remaining <= 0) break
    const qty = Math.min(t.quantity ?? 0, remaining)
    if (qty === (t.quantity ?? 0)) {
      await service.from('karma_tickets').update({ consumed: true }).eq('id', t.id)
    } else {
      await service.from('karma_tickets').update({ quantity: (t.quantity ?? 0) - qty }).eq('id', t.id)
    }
    remaining -= qty
  }

  // Tirage
  const rand = Math.random()
  let outcome: 'won' | 'lost' = 'lost'
  let prizeCents = 0
  let prizePoints = 0

  // Probabilités adaptées par jeu (simplifié)
  switch (game.slug) {
    case 'roue_solidaire':
      if (rand < 0.65) { outcome = 'won'; prizePoints = 50 + Math.floor(Math.random() * 150) }
      break
    case 'grattage_karma':
      if (rand < 0.4) { outcome = 'won'; prizePoints = 100 + Math.floor(Math.random() * 400) }
      else if (rand < 0.45) { outcome = 'won'; prizeCents = 100 + Math.floor(Math.random() * 400) }
      break
    case 'tirage_hebdo':
      outcome = 'lost'
      break
    case 'duel_gratitude':
      outcome = 'lost' // résultat hebdo via cron
      break
    case 'chasse_impact':
      outcome = 'lost' // récompense via cron
      break
    case 'loterie_saison':
      outcome = 'lost' // tirage saisonnier via cron
      break
  }

  const { data: play, error } = await service.from('karma_plays').insert({
    user_id: user.id,
    game_slug: game.slug,
    tickets_used: game.ticket_cost,
    outcome,
    prize_cents: prizeCents,
    prize_points: prizePoints,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Crédite points si gagné
  if (outcome === 'won' && prizePoints > 0) {
    const { data: points } = await service
      .from('purama_points')
      .select('balance, lifetime_earned')
      .eq('user_id', user.id)
      .maybeSingle()
    await service.from('purama_points').upsert({
      user_id: user.id,
      balance: (points?.balance ?? 0) + prizePoints,
      lifetime_earned: (points?.lifetime_earned ?? 0) + prizePoints,
      updated_at: new Date().toISOString(),
    })
    await service.from('point_transactions').insert({
      user_id: user.id,
      amount: prizePoints,
      type: 'earn',
      source: `karma_${game.slug}`,
    })
  }

  return NextResponse.json({ ok: true, play, game: { slug: game.slug, name: game.name } })
}

export async function GET() {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const service = createServiceClient()
  const [gamesRes, ticketsRes, recentRes] = await Promise.all([
    service.from('karma_games').select('*').eq('active', true).order('period'),
    service.from('karma_tickets').select('quantity').eq('user_id', user.id).eq('consumed', false),
    service.from('karma_plays').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(10),
  ])

  const tickets = (ticketsRes.data ?? []).reduce((s, t) => s + (t.quantity ?? 0), 0)
  return NextResponse.json({
    games: gamesRes.data ?? [],
    tickets,
    recent_plays: recentRes.data ?? [],
  })
}
