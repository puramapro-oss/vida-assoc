import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Mission } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  proof_photo_url: z.string().trim().min(1).max(2048).nullable().optional(),
  proof_text: z.string().max(500).nullable().optional(),
  proof_gps_lat: z.number().min(-90).max(90).nullable().optional(),
  proof_gps_lng: z.number().min(-180).max(180).nullable().optional(),
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise pour valider une mission.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })

  const { data: missionData, error: mErr } = await sb.from('missions').select('*').eq('id', id).maybeSingle()
  if (mErr) return NextResponse.json({ error: 'Impossible de charger cette mission.' }, { status: 500 })
  if (!missionData) return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })
  const mission = missionData as Mission
  if (mission.status !== 'active') return NextResponse.json({ error: 'Mission non disponible.' }, { status: 410 })

  if (mission.proof_required && !parsed.data.proof_photo_url && mission.verification_method !== 'mutual_confirmation') {
    return NextResponse.json({ error: 'Une preuve photo est requise pour cette mission.' }, { status: 400 })
  }

  const { data: existing, error: existingError } = await sb
    .from('mission_completions')
    .select('id')
    .eq('mission_id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existingError) {
    return NextResponse.json({ error: 'Impossible de vérifier les preuves déjà envoyées. Réessaie.' }, { status: 503 })
  }
  if (existing) return NextResponse.json({ error: 'Tu as déjà soumis une preuve pour cette mission.' }, { status: 409 })

  // A storage key and client-provided coordinates are claims awaiting verification.
  // A trusted review must happen before any validation or reward settlement.
  const { data: completion, error: cErr } = await sb
    .from('mission_completions')
    .insert({
      mission_id: id,
      user_id: user.id,
      status: 'pending',
      proof_photo_url: parsed.data.proof_photo_url ?? null,
      proof_text: parsed.data.proof_text ?? null,
      proof_gps_lat: parsed.data.proof_gps_lat ?? null,
      proof_gps_lng: parsed.data.proof_gps_lng ?? null,
      ai_validation_score: null,
      ai_validation_notes: null,
      human_review_needed: true,
      validated_at: null,
      reward_paid: false,
      reward_paid_at: null,
    })
    .select()
    .single()

  if (cErr?.code === '23505') {
    return NextResponse.json({ error: 'Tu as déjà soumis une preuve pour cette mission.' }, { status: 409 })
  }
  if (cErr || !completion) {
    return NextResponse.json({ error: 'Impossible d’enregistrer la preuve. Réessaie.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, completion })
}
