import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createDonationCheckoutSession } from '@/lib/stripe'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  recipient_type: z.enum(['association', 'vida', 'project']),
  recipient_id: z.string().uuid().nullable().optional(),
  amount_cents: z.number().int().min(100).max(500000),
  recurring: z.enum(['monthly', 'yearly']).nullable().optional(),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })

  const session = await createDonationCheckoutSession({
    amountCents: parsed.data.amount_cents,
    customerEmail: user.email,
    recipientType: parsed.data.recipient_type,
    recipientId: parsed.data.recipient_id ?? null,
    recurring: parsed.data.recurring ?? null,
    successUrl: `${APP_URL}/dashboard/dons?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${APP_URL}/dashboard/dons?cancelled=1`,
  })

  await sb.from('donations').insert({
    donor_id: user.id,
    recipient_type: parsed.data.recipient_type,
    recipient_id: parsed.data.recipient_id ?? null,
    amount_cents: parsed.data.amount_cents,
    currency: 'EUR',
    payment_method: 'stripe',
    is_recurring: !!parsed.data.recurring,
    recurring_interval: parsed.data.recurring ?? null,
    stripe_payment_intent_id: session.id,
    status: 'pending',
  })

  return NextResponse.json({ url: session.url })
}
