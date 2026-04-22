import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { buildTierceDeclaration, submitTierceDeclaration } from '@/lib/urssaf-td'
import type { FiscalProfile } from '@/lib/tax-assistant'

export const runtime = 'nodejs'
export const maxDuration = 60

const Body = z.object({
  period_type: z.enum(['month', 'quarter', 'year']),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount_cents: z.number().int().min(0),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, city, country')
    .eq('id', user.id)
    .maybeSingle()

  const { data: fiscal } = await service
    .from('fiscal_profiles')
    .select('profile_type, siret')
    .eq('user_id', user.id)
    .maybeSingle()

  const payload = buildTierceDeclaration({
    user_id: user.id,
    period_type: parsed.data.period_type,
    period_start: parsed.data.period_start,
    period_end: parsed.data.period_end,
    amount_cents: parsed.data.amount_cents,
    profile: (fiscal?.profile_type as FiscalProfile | undefined) ?? 'particulier_occ',
    siret: fiscal?.siret ?? null,
    full_name: profile?.full_name ?? user.email ?? 'Utilisateur Sangha',
  })

  const result = await submitTierceDeclaration(payload)

  const { data: decl, error } = await service.from('urssaf_declarations').insert({
    user_id: user.id,
    period_type: parsed.data.period_type,
    period_start: parsed.data.period_start,
    period_end: parsed.data.period_end,
    amount_cents: parsed.data.amount_cents,
    status: result.status === 'submitted' ? 'submitted' : result.status === 'rejected' ? 'rejected' : 'draft',
    external_ref: result.external_ref,
    submitted_at: result.status === 'submitted' ? new Date().toISOString() : null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, declaration: decl, submit: result })
}

export async function GET() {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from('urssaf_declarations')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false })
    .limit(20)

  return NextResponse.json({ declarations: data ?? [] })
}
