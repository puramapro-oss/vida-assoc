import Stripe from 'stripe'

// Lazy init — Vercel Turbopack evaluates modules during static analysis.
// See ~/purama/PATTERNS.md (MOKSHA).
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  }
  return _stripe
}

export const VIDA_STRIPE_PLANS = {
  one: {
    monthly_cents: 300,
    yearly_cents: 2520, // -30%
    label: 'VIDA One',
  },
  premium: {
    monthly_cents: 690,
    yearly_cents: 5798, // -30%
    first_month_discount_percent: 10,
    label: 'VIDA Premium',
  },
} as const

export type VidaPlanId = keyof typeof VIDA_STRIPE_PLANS

export async function createCheckoutSession(params: {
  customerId?: string
  customerEmail?: string
  plan: VidaPlanId
  interval: 'monthly' | 'yearly'
  successUrl: string
  cancelUrl: string
  referralCode?: string
  trialDays?: number
}) {
  const stripe = getStripe()
  const planCfg = VIDA_STRIPE_PLANS[params.plan]
  const amount = params.interval === 'monthly' ? planCfg.monthly_cents : planCfg.yearly_cents

  return stripe.checkout.sessions.create({
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.customerEmail,
    mode: 'subscription',
    payment_method_types: ['card', 'paypal', 'link'],
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: planCfg.label,
            description: params.plan === 'one'
              ? 'Abonnement VIDA One — 100 % reversés aux associations'
              : 'Abonnement VIDA Premium — missions illimitées, IA, rituels, concours x5',
          },
          recurring: { interval: params.interval === 'monthly' ? 'month' : 'year' },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: params.trialDays ?? 14,
      metadata: {
        plan: params.plan,
        interval: params.interval,
        ...(params.referralCode ? { referral_code: params.referralCode } : {}),
      },
    },
    metadata: {
      plan: params.plan,
      interval: params.interval,
      ...(params.referralCode ? { referral_code: params.referralCode } : {}),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })
}

export async function createDonationCheckoutSession(params: {
  amountCents: number
  customerEmail?: string
  recipientType: 'vida' | 'association' | 'project'
  recipientId?: string | null
  successUrl: string
  cancelUrl: string
  recurring?: 'monthly' | 'yearly' | null
}) {
  const stripe = getStripe()
  if (params.recurring) {
    return stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'paypal', 'link'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Don ${params.recipientType === 'vida' ? 'à VIDA' : 'solidaire'}`,
            },
            unit_amount: params.amountCents,
            recurring: { interval: params.recurring === 'monthly' ? 'month' : 'year' },
          },
          quantity: 1,
        },
      ],
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        type: 'donation',
        recipient_type: params.recipientType,
        recipient_id: params.recipientId ?? '',
      },
    })
  }
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'paypal', 'link'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Don ${params.recipientType === 'vida' ? 'à VIDA' : 'solidaire'}`,
          },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      type: 'donation',
      recipient_type: params.recipientType,
      recipient_id: params.recipientId ?? '',
    },
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe()
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
