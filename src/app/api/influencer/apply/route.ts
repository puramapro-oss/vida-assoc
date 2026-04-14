import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { APP_DOMAIN } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 10

const SLUG_REGEX = /^[a-z0-9-]{3,24}$/

const BodySchema = z.object({
  promo_code: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Minimum 3 caractères.')
    .max(24, 'Maximum 24 caractères.')
    .refine((s) => SLUG_REGEX.test(s), 'Lettres, chiffres et tirets uniquement.'),
  bio: z.string().trim().max(500).optional().or(z.literal('')),
  instagram: z.string().trim().max(80).optional().or(z.literal('')),
  tiktok: z.string().trim().max(80).optional().or(z.literal('')),
  youtube: z.string().trim().max(80).optional().or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: existing } = await admin
    .from('influencers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Tu as déjà un profil influenceur.' }, { status: 409 })
  }

  const { data: codeTaken } = await admin
    .from('influencers')
    .select('id')
    .eq('promo_code', parsed.data.promo_code)
    .maybeSingle()
  if (codeTaken) {
    return NextResponse.json({ error: 'Ce code promo est déjà pris — choisis-en un autre.' }, { status: 409 })
  }

  const socialLinks: Record<string, string> = {}
  if (parsed.data.instagram) socialLinks.instagram = parsed.data.instagram
  if (parsed.data.tiktok) socialLinks.tiktok = parsed.data.tiktok
  if (parsed.data.youtube) socialLinks.youtube = parsed.data.youtube
  if (parsed.data.website) socialLinks.website = parsed.data.website

  const promoLink = `https://${APP_DOMAIN}/go/${parsed.data.promo_code}`

  const { data, error } = await admin
    .from('influencers')
    .insert({
      user_id: user.id,
      promo_code: parsed.data.promo_code,
      promo_link: promoLink,
      bio: parsed.data.bio && parsed.data.bio !== '' ? parsed.data.bio : null,
      social_links: socialLinks,
      approved: true,
      dashboard_enabled: true,
    })
    .select('id, promo_code, promo_link, bio, social_links, approved, total_clicks, total_conversions, total_earned_cents, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Création impossible. Réessaie.' }, { status: 500 })
  }

  await admin.from('notifications').insert({
    user_id: user.id,
    type: 'influencer',
    title: 'Bienvenue dans la famille créateurs VIDA 🎉',
    body: `Ton lien est prêt : ${promoLink}. Partage-le et reçois 50 % du premier abo + 10 % à vie.`,
    icon: '📣',
    action_url: '/dashboard/influenceur',
  })

  return NextResponse.json({ ok: true, influencer: data })
}
