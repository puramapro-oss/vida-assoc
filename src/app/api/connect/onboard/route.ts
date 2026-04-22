import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { createExpressAccount, createAccountOnboardingLink, createAccountSession } from '@/lib/stripe-connect'
import type { ConnectProfileType } from '@/lib/stripe-connect'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'

const Body = z.object({
  profileType: z.enum(['particulier_occ', 'bnc', 'autoentrepreneur', 'entreprise']),
  mode: z.enum(['link', 'embedded']).default('link'),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })

  const service = createServiceClient()

  const { data: existing } = await service
    .from('connect_accounts')
    .select('stripe_account_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  let stripeAccountId = existing?.stripe_account_id as string | undefined

  if (!stripeAccountId) {
    try {
      const account = await createExpressAccount({
        email: user.email,
        profileType: parsed.data.profileType as ConnectProfileType,
      })
      stripeAccountId = account.id
      await service.from('connect_accounts').insert({
        user_id: user.id,
        stripe_account_id: account.id,
        profile_type: parsed.data.profileType,
        status: 'pending',
        country: 'FR',
      })
      // upsert fiscal_profile
      await service.from('fiscal_profiles').upsert({
        user_id: user.id,
        profile_type: parsed.data.profileType,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur Stripe Connect'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  if (parsed.data.mode === 'embedded') {
    const session = await createAccountSession(stripeAccountId!)
    return NextResponse.json({ account_id: stripeAccountId, client_secret: session.client_secret })
  }

  const link = await createAccountOnboardingLink({
    accountId: stripeAccountId!,
    refreshUrl: `${APP_URL}/dashboard/wallet?connect=refresh`,
    returnUrl: `${APP_URL}/dashboard/wallet?connect=success`,
  })
  return NextResponse.json({ account_id: stripeAccountId, url: link.url })
}
