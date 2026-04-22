import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { detectProfile, getRetraitMessage, shouldEscalate, formatProfileLabel } from '@/lib/tax-assistant'

export const runtime = 'nodejs'

const Body = z.object({
  siret: z.string().regex(/^\d{14}$/).optional(),
}).optional()

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'SIRET invalide.' }, { status: 400 })

  const service = createServiceClient()

  const { data: existing } = await service
    .from('fiscal_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const ctx = {
    cumul_annual_cents: existing?.cumul_annual_cents ?? 0,
    has_siret: !!(parsed.data?.siret || existing?.siret),
    current_profile: (existing?.profile_type as never) ?? null,
  }

  const detected = detectProfile(ctx)
  const message = getRetraitMessage(detected, ctx.cumul_annual_cents)
  const escalate = shouldEscalate(detected, ctx.cumul_annual_cents)

  await service.from('fiscal_profiles').upsert({
    user_id: user.id,
    profile_type: detected,
    siret: parsed.data?.siret ?? existing?.siret ?? null,
    cumul_annual_cents: ctx.cumul_annual_cents,
    escalated_at: escalate ? new Date().toISOString() : existing?.escalated_at ?? null,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({
    profile: detected,
    label: formatProfileLabel(detected),
    cumul_annual_cents: ctx.cumul_annual_cents,
    message,
    should_escalate: escalate,
  })
}

export async function GET() {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from('fiscal_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const profile = (data?.profile_type as never) ?? 'particulier_occ'
  const cumul = data?.cumul_annual_cents ?? 0
  return NextResponse.json({
    profile,
    label: formatProfileLabel(profile),
    cumul_annual_cents: cumul,
    message: getRetraitMessage(profile, cumul),
    should_escalate: shouldEscalate(profile, cumul),
  })
}
