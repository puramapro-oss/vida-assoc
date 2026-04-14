import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createCheckoutSession, type VidaPlanId } from '@/lib/stripe'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  plan: z.enum(['one', 'premium']),
  interval: z.enum(['monthly', 'yearly']),
  referral_code: z.string().max(40).optional(),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })

  const { data: profile } = await sb
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .maybeSingle()

  const session = await createCheckoutSession({
    plan: parsed.data.plan as VidaPlanId,
    interval: parsed.data.interval,
    customerId: profile?.stripe_customer_id ?? undefined,
    customerEmail: user.email,
    referralCode: parsed.data.referral_code,
    successUrl: `${APP_URL}/dashboard?upgraded=1`,
    cancelUrl: `${APP_URL}/pricing?cancelled=1`,
  })

  return NextResponse.json({ url: session.url })
}
