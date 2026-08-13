import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const service = createServiceClient()
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const item = sub.items.data[0]
  const interval = item?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'
  const planFromMeta = (sub.metadata?.plan as 'one' | 'premium' | undefined) ?? 'premium'

  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (!profile) return

  const periodStart = item?.current_period_start
  const periodEnd = item?.current_period_end

  await service
    .from('profiles')
    .update({
      plan: sub.status === 'active' || sub.status === 'trialing' ? planFromMeta : 'free',
      stripe_subscription_id: sub.id,
      subscription_interval: interval,
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      paused_at: sub.pause_collection ? new Date().toISOString() : null,
    })
    .eq('id', profile.id)

  await service.from('subscriptions').upsert(
    {
      user_id: profile.id,
      plan: planFromMeta,
      interval,
      price_cents: item?.price.unit_amount ?? 0,
      currency: (item?.price.currency ?? 'eur').toUpperCase(),
      stripe_subscription_id: sub.id,
      stripe_price_id: item?.price.id ?? null,
      status: sub.status as 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused' | 'incomplete',
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancelled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    },
    { onConflict: 'stripe_subscription_id' },
  )
}

/**
 * Phase 1 : allouer prime de bienvenue au paiement d'abonnement
 * (conforme alignement prime ↔ abonnement, V4.1 §🎁 anti-fraude).
 * Phase 2 bascule via env PRIME_MODE=phase2.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_create' && invoice.billing_reason !== 'subscription_cycle') return
  const amount = invoice.amount_paid ?? 0
  if (amount <= 0) return

  const service = createServiceClient()
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const { data: profile } = await service
    .from('profiles')
    .select('id, created_at')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (!profile) return

  // Prime Phase 1 = 50% du premier paiement, plafond 10€ (1000 cents)
  const isFirst = invoice.billing_reason === 'subscription_create'
  const primeCents = isFirst ? Math.min(Math.floor(amount * 0.5), 1000) : Math.floor(amount * 0.05)
  if (primeCents <= 0) return

  const unlockable = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const mode = (process.env.PRIME_MODE === 'phase2' ? 'phase2' : 'phase1') as 'phase1' | 'phase2'

  await service.from('prime_allocations').insert({
    user_id: profile.id,
    amount_cents: primeCents,
    mode,
    source_event: 'subscription_paid',
    source_ref: invoice.id,
    unlockable_at: unlockable,
    status: 'pending',
    metadata: {
      invoice_amount_cents: amount,
      billing_reason: invoice.billing_reason,
    },
  })
}

async function handleConnectAccountUpdated(account: Stripe.Account) {
  const service = createServiceClient()
  await service
    .from('connect_accounts')
    .update({
      status: account.charges_enabled && account.payouts_enabled ? 'enabled' : account.requirements?.disabled_reason ? 'restricted' : 'pending',
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      onboarded_at: account.details_submitted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_account_id', account.id)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const service = createServiceClient()
  const stripe = getStripe()

  if (session.mode === 'subscription' && session.metadata?.type !== 'donation') {
    if (session.customer && session.customer_email) {
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id
      await service.from('profiles').update({ stripe_customer_id: customerId }).eq('email', session.customer_email)
    }
    if (session.subscription) {
      const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
      const sub = await stripe.subscriptions.retrieve(subId)
      await handleSubscriptionUpsert(sub)
    }
    return
  }

  if (session.metadata?.type === 'donation') {
    await service
      .from('donations')
      .update({
        status: 'succeeded',
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
      })
      .eq('stripe_payment_intent_id', session.id)

    if (session.metadata.recipient_id && session.amount_total) {
      const { data: asso } = await service
        .from('associations')
        .select('donations_received_cents, balance_cents')
        .eq('id', session.metadata.recipient_id)
        .maybeSingle()
      if (asso) {
        await service
          .from('associations')
          .update({
            donations_received_cents: (asso.donations_received_cents ?? 0) + session.amount_total,
            balance_cents: (asso.balance_cents ?? 0) + session.amount_total,
          })
          .eq('id', session.metadata.recipient_id)
      }
    }
  }
}

export async function POST(req: Request) {
  // 1. Internal secret auth (from karma dispatcher)
  const internalSecret = req.headers.get('x-internal-secret')
  if (internalSecret !== process.env.INTERNAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // 2. Defense-in-depth: still verify Stripe signature
  const sig = req.headers.get('x-stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 400 })

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Bad signature'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()

  // Idempotency — process each event exactly once (unique violation = already done).
  const { error: dupErr } = await service
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type })
  if (dupErr) {
    if (dupErr.code === '23505') return NextResponse.json({ received: true, duplicate: true })
    return NextResponse.json({ error: 'Erreur idempotence' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpsert(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object)
        break
      case 'account.updated':
        await handleConnectAccountUpdated(event.data.object as Stripe.Account)
        break
      default:
        break
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Webhook handler error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
