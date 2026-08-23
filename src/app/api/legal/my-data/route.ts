/**
 * GET /api/legal/my-data — export complet des données personnelles au format JSON
 * (droit à la portabilité, art. 20 RGPD ; page « Ma mémoire »). Couvre toutes les tables
 * `vida_assoc.*` réellement liées à un user_id/donor_id (cf schema.sql) — pas seulement
 * `profiles`, sans quoi l'export "réussit" mais omet la donnée la plus sensible.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const EXTRA_TABLES: Array<{ table: string; userIdColumn: string }> = [
  { table: 'donations', userIdColumn: 'donor_id' },
  { table: 'material_donations', userIdColumn: 'donor_id' },
  { table: 'donation_subscriptions', userIdColumn: 'user_id' },
  { table: 'mission_completions', userIdColumn: 'user_id' },
  { table: 'invoices', userIdColumn: 'user_id' },
  { table: 'subscriptions', userIdColumn: 'user_id' },
  { table: 'wallet_transactions', userIdColumn: 'user_id' },
  { table: 'credit_transactions', userIdColumn: 'user_id' },
  { table: 'withdrawals', userIdColumn: 'user_id' },
  { table: 'notifications', userIdColumn: 'user_id' },
  { table: 'community_posts', userIdColumn: 'user_id' },
  { table: 'community_comments', userIdColumn: 'user_id' },
  { table: 'community_likes', userIdColumn: 'user_id' },
  { table: 'contest_entries', userIdColumn: 'user_id' },
  { table: 'ritual_participations', userIdColumn: 'user_id' },
  { table: 'formation_progress', userIdColumn: 'user_id' },
  { table: 'user_ads', userIdColumn: 'user_id' },
  { table: 'contact_messages', userIdColumn: 'user_id' },
  { table: 'product_purchases', userIdColumn: 'user_id' },
  { table: 'meetup_participants', userIdColumn: 'user_id' },
  { table: 'referral_commissions', userIdColumn: 'referrer_id' },
]

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const [{ data: profile }, { data: acceptances }, { data: cookieConsent }, { data: referrals }, { data: conversations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('legal_acceptances').select('doc_type, version, accepted_at').eq('user_id', user.id),
    supabase.from('cookie_consents').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('referrals').select('*').or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`),
    supabase.from('conversations').select('id, title, created_at, updated_at').eq('user_id', user.id),
  ])

  const extra: Record<string, unknown> = {}
  for (const { table, userIdColumn } of EXTRA_TABLES) {
    const { data } = await supabase.from(table).select('*').eq(userIdColumn, user.id)
    extra[table] = data ?? []
  }

  const conversationIds = (conversations ?? []).map((c) => c.id)
  const { data: messages } = conversationIds.length
    ? await supabase.from('messages').select('*').in('conversation_id', conversationIds)
    : { data: [] }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    compte: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile ?? null,
    acceptationsLegales: acceptances ?? [],
    consentementCookies: cookieConsent ?? null,
    parrainage: referrals ?? [],
    conversations: conversations ?? [],
    messages: messages ?? [],
    ...extra,
  }

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="mes-donnees-sangha.json"',
    },
  })
}
