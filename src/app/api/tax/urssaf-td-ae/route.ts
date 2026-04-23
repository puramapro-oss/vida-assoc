import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { URSSAFService } from '@/lib/urssaf-td-ae'

export const runtime = 'nodejs'
export const maxDuration = 60

const Body = z.object({
  action: z.enum(['estimer', 'declarer', 'payer', 'creer_mandat', 'lister_comptes']),
  period_type: z.enum(['month', 'quarter']).optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period_end:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amount_cents: z.number().int().min(0).max(100_000_000).optional(),
  declaration_id: z.string().optional(),
  rum: z.string().optional(),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.', details: parsed.error.flatten() }, { status: 400 })

  const service = createServiceClient()
  const { data: fiscal } = await service
    .from('fiscal_profiles')
    .select('siret, profile_type')
    .eq('user_id', user.id)
    .maybeSingle()

  // Seuls auto-entrepreneurs ont accès à TD-AE
  const profile = fiscal?.profile_type as string | undefined
  if (parsed.data.action !== 'lister_comptes' && profile !== 'autoentrepreneur') {
    return NextResponse.json({
      error: 'TD-AE réservé aux auto-entrepreneurs.',
      current_profile: profile ?? null,
    }, { status: 400 })
  }

  const siret = fiscal?.siret ?? null

  try {
    switch (parsed.data.action) {
      case 'lister_comptes': {
        const r = await URSSAFService.getComptes(siret ?? undefined)
        return NextResponse.json(r)
      }
      case 'creer_mandat': {
        if (!siret) return NextResponse.json({ error: 'SIRET requis.' }, { status: 400 })
        const r = await URSSAFService.createMandat({
          siret,
          start_date: new Date().toISOString().slice(0, 10),
          rum: parsed.data.rum ?? `SANGHA-${user.id.slice(0, 8)}-${Date.now()}`,
          ics: process.env.PURAMA_SEPA_ICS ?? 'FR00ZZZ000000',
        })
        return NextResponse.json(r)
      }
      case 'estimer': {
        if (!parsed.data.amount_cents || !parsed.data.period_start || !parsed.data.period_end) {
          return NextResponse.json({ error: 'amount_cents + period_start + period_end requis.' }, { status: 400 })
        }
        const r = await URSSAFService.estimerCotisations({
          siret: siret ?? '',
          period: {
            type: parsed.data.period_type ?? 'month',
            start: parsed.data.period_start,
            end: parsed.data.period_end,
          },
          amount_cents: parsed.data.amount_cents,
        })
        return NextResponse.json(r)
      }
      case 'declarer': {
        if (!parsed.data.amount_cents || !parsed.data.period_start || !parsed.data.period_end) {
          return NextResponse.json({ error: 'amount_cents + period_start + period_end requis.' }, { status: 400 })
        }
        if (!siret) return NextResponse.json({ error: 'SIRET requis.' }, { status: 400 })
        const r = await URSSAFService.declarerCa({
          siret,
          user_id: user.id,
          period: {
            type: parsed.data.period_type ?? 'month',
            start: parsed.data.period_start,
            end: parsed.data.period_end,
          },
          amount_cents: parsed.data.amount_cents,
        })
        return NextResponse.json(r)
      }
      case 'payer': {
        if (!parsed.data.declaration_id || !parsed.data.amount_cents) {
          return NextResponse.json({ error: 'declaration_id + amount_cents requis.' }, { status: 400 })
        }
        const r = await URSSAFService.payerDeclaration({
          declaration_id: parsed.data.declaration_id,
          amount_cents: parsed.data.amount_cents,
          rum: parsed.data.rum ?? null,
        })
        return NextResponse.json(r)
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'URSSAF TD-AE error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'URSSAF TD-AE (auto-entrepreneur)',
    doc: 'https://portailapi.urssaf.fr/fr/catalogue-api/prd/td-ae',
    has_credentials: URSSAFService.hasCredentials(),
    endpoints: ['lister_comptes', 'creer_mandat', 'estimer', 'declarer', 'payer'],
  })
}
