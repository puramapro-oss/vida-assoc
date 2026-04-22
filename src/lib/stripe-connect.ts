/**
 * Stripe Connect Express + Embedded Components.
 * V4.1 — 19/04/2026 : pas de STRIPE_CONNECT_CLIENT_ID (réservé OAuth/Standard).
 * AccountSession créée serveur avec STRIPE_SECRET_KEY.
 */

import { getStripe } from '@/lib/stripe'

export type ConnectProfileType = 'particulier_occ' | 'bnc' | 'autoentrepreneur' | 'entreprise'

export async function createExpressAccount(params: {
  email: string
  country?: string
  profileType: ConnectProfileType
}) {
  const stripe = getStripe()
  const isIndividual = params.profileType === 'particulier_occ' || params.profileType === 'bnc'
  return stripe.accounts.create({
    type: 'express',
    country: params.country ?? 'FR',
    email: params.email,
    business_type: isIndividual ? 'individual' : params.profileType === 'autoentrepreneur' ? 'individual' : 'company',
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    metadata: {
      profile_type: params.profileType,
      source: 'sangha',
    },
  })
}

export async function createAccountOnboardingLink(params: {
  accountId: string
  refreshUrl: string
  returnUrl: string
}) {
  const stripe = getStripe()
  return stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: 'account_onboarding',
  })
}

/**
 * AccountSession pour Embedded Components (V4.1 voie officielle).
 * Client utilise client_secret avec @stripe/connect-js.
 */
export async function createAccountSession(accountId: string) {
  const stripe = getStripe()
  return stripe.accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: { enabled: true },
      payouts: { enabled: true },
      notification_banner: { enabled: true },
    },
  })
}

export async function payoutToBank(params: {
  accountId: string
  amountCents: number
  description?: string
}) {
  const stripe = getStripe()
  return stripe.transfers.create({
    amount: params.amountCents,
    currency: 'eur',
    destination: params.accountId,
    description: params.description ?? 'Sangha payout',
  })
}

export async function getAccountStatus(accountId: string) {
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(accountId)
  return {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    requirements: account.requirements,
    disabled_reason: account.requirements?.disabled_reason ?? null,
  }
}
