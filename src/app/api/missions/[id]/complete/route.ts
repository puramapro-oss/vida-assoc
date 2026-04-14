import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { Mission } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  proof_photo_url: z.string().nullable().optional(),
  proof_text: z.string().max(500).nullable().optional(),
  proof_gps_lat: z.number().min(-90).max(90).nullable().optional(),
  proof_gps_lng: z.number().min(-180).max(180).nullable().optional(),
})

function naiveAiScore(args: { hasPhoto: boolean; hasGps: boolean; verification: Mission['verification_method'] }) {
  let score = 0.4
  if (args.hasPhoto) score += 0.4
  if (args.hasGps) score += 0.15
  if (args.verification === 'mutual_confirmation' || args.verification === 'qr') score -= 0.1
  return Math.max(0, Math.min(1, score))
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise pour valider une mission.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })

  const { data: missionData, error: mErr } = await sb.from('missions').select('*').eq('id', id).maybeSingle()
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  if (!missionData) return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })
  const mission = missionData as Mission
  if (mission.status !== 'active') return NextResponse.json({ error: 'Mission non disponible.' }, { status: 410 })

  if (mission.proof_required && !parsed.data.proof_photo_url && mission.verification_method !== 'mutual_confirmation') {
    return NextResponse.json({ error: 'Une preuve photo est requise pour cette mission.' }, { status: 400 })
  }

  const { data: existing } = await sb
    .from('mission_completions')
    .select('id')
    .eq('mission_id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'Tu as déjà soumis une preuve pour cette mission.' }, { status: 409 })

  const aiScore = naiveAiScore({
    hasPhoto: !!parsed.data.proof_photo_url,
    hasGps: parsed.data.proof_gps_lat != null && parsed.data.proof_gps_lng != null,
    verification: mission.verification_method,
  })
  const autoValidate = aiScore >= 0.75
  const status: 'pending' | 'validated' = autoValidate ? 'validated' : 'pending'

  const { data: completion, error: cErr } = await sb
    .from('mission_completions')
    .insert({
      mission_id: id,
      user_id: user.id,
      status,
      proof_photo_url: parsed.data.proof_photo_url ?? null,
      proof_text: parsed.data.proof_text ?? null,
      proof_gps_lat: parsed.data.proof_gps_lat ?? null,
      proof_gps_lng: parsed.data.proof_gps_lng ?? null,
      ai_validation_score: aiScore,
      ai_validation_notes: autoValidate ? 'Preuve cohérente — validation automatique VIDA.' : 'Preuve en attente de validation par VIDA.',
      validated_at: autoValidate ? new Date().toISOString() : null,
      reward_paid: autoValidate,
      reward_paid_at: autoValidate ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  if (autoValidate) {
    const service = createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('vida_credits, total_missions_completed, impact_score, contest_tickets, wallet_balance_cents, total_earned_cents, xp')
      .eq('id', user.id)
      .maybeSingle()
    if (profile) {
      await service
        .from('profiles')
        .update({
          vida_credits: (profile.vida_credits ?? 0) + (mission.reward_vida_credits ?? 0),
          contest_tickets: (profile.contest_tickets ?? 0) + (mission.reward_contest_tickets ?? 0),
          wallet_balance_cents: (profile.wallet_balance_cents ?? 0) + (mission.reward_amount_cents ?? 0),
          total_earned_cents: (profile.total_earned_cents ?? 0) + (mission.reward_amount_cents ?? 0),
          total_missions_completed: (profile.total_missions_completed ?? 0) + 1,
          impact_score: (profile.impact_score ?? 0) + 10,
          xp: (profile.xp ?? 0) + 25,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      await service
        .from('missions')
        .update({ current_participants: (mission.current_participants ?? 0) + 1 })
        .eq('id', id)
    }
  }

  return NextResponse.json({ ok: true, completion })
}
