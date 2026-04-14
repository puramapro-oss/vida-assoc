import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 15

const BodySchema = z.object({
  action: z.enum(['validate', 'reject']),
  reason: z.string().trim().max(300).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 })
  }

  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const admin = createServiceClient()
  const { data: me } = await admin.from('profiles').select('email, role').eq('id', user.id).single()
  const isAdmin = me?.email === SUPER_ADMIN_EMAIL || me?.role === 'super_admin'
  if (!isAdmin) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const json = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 })
  }

  const { data: completion, error: compErr } = await admin
    .from('mission_completions')
    .select('id, mission_id, user_id, status, reward_paid')
    .eq('id', id)
    .single()

  if (compErr || !completion) {
    return NextResponse.json({ error: 'Validation introuvable.' }, { status: 404 })
  }

  if (completion.status !== 'pending') {
    return NextResponse.json({ error: 'Cette validation a déjà été traitée.' }, { status: 409 })
  }

  if (parsed.data.action === 'reject') {
    await admin
      .from('mission_completions')
      .update({
        status: 'rejected',
        ai_validation_notes: parsed.data.reason ?? 'Rejet manuel par l’équipe VIDA.',
        reviewed_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', id)

    await admin.from('notifications').insert({
      user_id: completion.user_id,
      type: 'system',
      title: 'Mission non validée',
      body: parsed.data.reason ?? 'Ta preuve n’a pas pu être validée. Réessaie en ajoutant plus de détails 🌿',
      icon: '🪷',
      action_url: '/dashboard/missions',
    })

    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // action = validate — crédite le user
  const { data: mission } = await admin
    .from('missions')
    .select('id, title, reward_vida_credits, reward_amount_cents, current_participants')
    .eq('id', completion.mission_id)
    .single()

  if (!mission) {
    return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })
  }

  const { data: userProfile } = await admin
    .from('profiles')
    .select('id, vida_credits, wallet_balance_cents, total_earned_cents, total_missions_completed, impact_score, xp')
    .eq('id', completion.user_id)
    .single()

  if (!userProfile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })

  const credits = mission.reward_vida_credits ?? 0
  const cents = mission.reward_amount_cents ?? 0
  const newCredits = (userProfile.vida_credits ?? 0) + credits
  const newWallet = (userProfile.wallet_balance_cents ?? 0) + cents
  const newEarned = (userProfile.total_earned_cents ?? 0) + cents
  const newMissions = (userProfile.total_missions_completed ?? 0) + 1
  const newImpact = (userProfile.impact_score ?? 0) + Math.max(10, Math.round(credits / 10))
  const newXp = (userProfile.xp ?? 0) + 50

  await admin
    .from('profiles')
    .update({
      vida_credits: newCredits,
      wallet_balance_cents: newWallet,
      total_earned_cents: newEarned,
      total_missions_completed: newMissions,
      impact_score: newImpact,
      xp: newXp,
    })
    .eq('id', completion.user_id)

  await admin
    .from('mission_completions')
    .update({
      status: 'validated',
      ai_validation_notes: parsed.data.reason ?? 'Validé manuellement par l’équipe VIDA.',
      reviewed_by: user.id,
      validated_at: new Date().toISOString(),
      reward_paid: true,
      reward_paid_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (cents > 0) {
    await admin.from('wallet_transactions').insert({
      user_id: completion.user_id,
      amount_cents: cents,
      currency: 'EUR',
      type: 'mission_reward',
      source_id: completion.mission_id,
      description: `Mission validée : ${mission.title}`,
      balance_after_cents: newWallet,
    })
  }
  if (credits > 0) {
    await admin.from('credit_transactions').insert({
      user_id: completion.user_id,
      amount: credits,
      type: 'mission',
      source_id: completion.mission_id,
      description: `Mission validée : ${mission.title}`,
      balance_after: newCredits,
    })
  }

  await admin
    .from('missions')
    .update({ current_participants: (mission.current_participants ?? 0) + 1 })
    .eq('id', mission.id)

  await admin.from('notifications').insert({
    user_id: completion.user_id,
    type: 'reward',
    title: 'Mission validée 🎉',
    body: `Bravo ! Tu as reçu ${credits} crédits VIDA${cents > 0 ? ` + ${(cents / 100).toFixed(2).replace('.', ',')} €` : ''}.`,
    icon: '✨',
    action_url: '/dashboard/wallet',
  })

  return NextResponse.json({ ok: true, status: 'validated', credits, cents })
}
