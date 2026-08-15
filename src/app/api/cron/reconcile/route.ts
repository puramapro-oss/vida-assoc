import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { Resend } from 'resend'

// Réconciliation wallet ↔ Stripe — ALERTE UNIQUEMENT, aucune correction
// automatique. vida_assoc n'a PAS de split KARMA 50/10/40 local (pas de
// payments.karma_split) : le modèle réel est prime_allocations (bonus
// bienvenue 50% 1er paiement plafonné 10€, ou 5% récurrent — cf
// handleInvoicePaid) + referral_commissions (parrainage N1 50% 1er
// paiement uniquement). wallet_transactions a un avantage unique ici :
// balance_after_cents snapshotte le solde après CHAQUE transaction —
// comparer directement à profiles.wallet_balance_cents, pas besoin de
// sommer tout le ledger.

const WINDOW_DAYS = 7
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@vida-assoc.purama.dev'
const SUPER_ADMIN_EMAIL = 'matiss.frasne@gmail.com'

function verifyCron(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`
}

function getSvc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'vida_assoc' } }
  )
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const svc = getSvc()
  const stripe = getStripe()
  const windowEnd = new Date()
  const windowStart = new Date(windowEnd.getTime() - WINDOW_DAYS * 86400000)
  const details: Array<Record<string, unknown>> = []

  try {
    // Check A — pour chaque facture Stripe payée (fenêtre), la prime
    // correspondante (source_ref=invoice.id) doit exister dans
    // prime_allocations, quel que soit son statut d'unlock.
    const stripeInvoices = await stripe.invoices.list({
      status: 'paid',
      created: { gte: Math.floor(windowStart.getTime() / 1000) },
      limit: 100,
    })

    const { data: primes, error: primesErr } = await svc
      .from('prime_allocations')
      .select('source_ref, amount_cents')
      .gte('allocated_at', windowStart.toISOString())
    if (primesErr) throw primesErr
    const primeRefs = new Set((primes ?? []).map(p => p.source_ref))

    let invoicesWithoutPrime = 0
    for (const invoice of stripeInvoices.data) {
      if ((invoice.amount_paid ?? 0) <= 0) continue
      if (!primeRefs.has(invoice.id)) {
        invoicesWithoutPrime++
        details.push({ check: 'invoice_without_prime', invoice_id: invoice.id, amount_paid_cents: invoice.amount_paid })
      }
    }

    // Check B — referrals.status='converted' doit avoir une
    // referral_commissions correspondante (même referral_id).
    const { data: convertedReferrals, error: refErr } = await svc
      .from('referrals')
      .select('id, referrer_id, first_subscription_earned_cents')
      .eq('status', 'converted')
    if (refErr) throw refErr

    const { data: commissions, error: commErr } = await svc
      .from('referral_commissions')
      .select('referral_id, amount_cents')
      .eq('commission_type', 'first_subscription')
    if (commErr) throw commErr

    const referralMismatches = (convertedReferrals ?? []).filter(
      r => !(commissions ?? []).some(c => c.referral_id === r.id && c.amount_cents === r.first_subscription_earned_cents)
    )
    if (referralMismatches.length > 0) {
      details.push({
        check: 'referral_commission_mismatches',
        count: referralMismatches.length,
        sample: referralMismatches.slice(0, 10),
      })
    }

    // Check C — solde profiles.wallet_balance_cents vs la DERNIÈRE
    // wallet_transactions.balance_after_cents de ce user (snapshot direct,
    // pas de somme de ledger nécessaire).
    const { data: allProfiles, error: profErr } = await svc
      .from('profiles')
      .select('id, wallet_balance_cents')
    if (profErr) throw profErr

    const walletMismatches: Array<{ id: string; stored: number; snapshot: number }> = []
    for (const p of allProfiles ?? []) {
      const { data: lastTxn } = await svc
        .from('wallet_transactions')
        .select('balance_after_cents')
        .eq('user_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lastTxn && lastTxn.balance_after_cents !== p.wallet_balance_cents) {
        walletMismatches.push({ id: p.id, stored: p.wallet_balance_cents, snapshot: lastTxn.balance_after_cents })
      }
    }
    if (walletMismatches.length > 0) {
      details.push({
        check: 'wallet_ledger_mismatches',
        count: walletMismatches.length,
        sample: walletMismatches.slice(0, 10),
      })
    }

    const hasDrift = details.length > 0
    let alertSent = false

    if (hasDrift) {
      try {
        await resend.emails.send({
          from: FROM,
          to: SUPER_ADMIN_EMAIL,
          subject: `⚠️ VIDA ASSOC — Réconciliation wallet↔Stripe : ${details.length} anomalie(s) détectée(s)`,
          html: `
            <h1>Réconciliation VIDA ASSOC — ${windowEnd.toISOString().slice(0, 10)}</h1>
            <p>Fenêtre : ${windowStart.toISOString()} → ${windowEnd.toISOString()}</p>
            <ul>
              <li>Factures Stripe payées sans prime locale : ${invoicesWithoutPrime}</li>
              <li>Commissions parrain non retrouvées : ${referralMismatches.length}</li>
              <li>Soldes wallet incohérents avec le dernier snapshot ledger : ${walletMismatches.length}</li>
            </ul>
            <p>Détail complet dans <code>vida_assoc.reconciliation_reports</code>. Aucune correction automatique effectuée — revue humaine requise avant toute action. Pas de check split KARMA 50/10/40 : cette app n'implémente pas ce modèle localement (prime + parrainage uniquement).</p>
          `,
        })
        alertSent = true
      } catch (e) {
        details.push({ check: 'alert_email_failed', error: String(e) })
      }
    }

    await svc.from('reconciliation_reports').insert({
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      invoices_without_prime: invoicesWithoutPrime,
      referral_commission_mismatches: referralMismatches.length,
      wallet_ledger_mismatches: walletMismatches.length,
      details,
      alert_sent: alertSent,
    })

    return NextResponse.json({
      ok: true,
      hasDrift,
      alertSent,
      report: { invoicesWithoutPrime, referralMismatches: referralMismatches.length, walletMismatches: walletMismatches.length },
    })
  } catch (error) {
    console.error('[cron/reconcile]', error)
    return NextResponse.json(
      { error: 'Erreur réconciliation', details: (error as Error).message },
      { status: 500 }
    )
  }
}
