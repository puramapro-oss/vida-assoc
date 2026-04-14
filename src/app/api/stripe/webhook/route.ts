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
  const sig = req.headers.get('stripe-signature')
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
        // could trigger 10% asso/reward pool here in P3
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
