import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 15

const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/

const BodySchema = z.object({
  amount_cents: z.number().int().min(500, 'Montant minimum : 5 €.').max(100000, 'Montant maximum : 1 000 €.'),
  iban: z
    .string()
    .trim()
    .transform((s) => s.replace(/\s+/g, '').toUpperCase())
    .refine((s) => IBAN_REGEX.test(s), 'IBAN invalide. Format attendu : FR76…'),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  const { amount_cents, iban } = parsed.data

  const admin = createServiceClient()
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('id, wallet_balance_cents')
    .eq('id', user.id)
    .single()

  if (profErr || !profile) {
    return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })
  }

  const balance = profile.wallet_balance_cents ?? 0
  if (amount_cents > balance) {
    return NextResponse.json({ error: 'Solde insuffisant pour ce retrait.' }, { status: 400 })
  }

  // Pending withdrawals (en attente / processing) déjà existants ?
  const { count: pendingCount } = await admin
    .from('withdrawals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])

  if ((pendingCount ?? 0) > 0) {
    return NextResponse.json({ error: 'Un retrait est déjà en cours de traitement.' }, { status: 409 })
  }

  const newBalance = balance - amount_cents

  const { data: withdrawal, error: wErr } = await admin
    .from('withdrawals')
    .insert({
      user_id: user.id,
      amount_cents,
      iban,
      status: 'pending',
    })
    .select('id, amount_cents, status, requested_at')
    .single()

  if (wErr || !withdrawal) {
    return NextResponse.json({ error: 'Impossible d’enregistrer la demande de retrait.' }, { status: 500 })
  }

  await admin.from('profiles').update({ wallet_balance_cents: newBalance, iban }).eq('id', user.id)

  await admin.from('wallet_transactions').insert({
    user_id: user.id,
    amount_cents: -amount_cents,
    currency: 'EUR',
    type: 'withdrawal',
    source_id: withdrawal.id,
    description: 'Demande de retrait IBAN',
    balance_after_cents: newBalance,
  })

  await admin.from('notifications').insert({
    user_id: user.id,
    type: 'system',
    title: 'Demande de retrait enregistrée',
    body: `Ton retrait de ${(amount_cents / 100).toFixed(2).replace('.', ',')} € est en cours de traitement (2-5 jours ouvrés).`,
    icon: '💸',
    action_url: '/dashboard/wallet',
  })

  return NextResponse.json({ ok: true, withdrawal, balance_cents: newBalance })
}
