import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 10

const THEMES = ['dark', 'light', 'oled', 'auto'] as const
const ACCESS_MODES = ['standard', 'visuel', 'auditif', 'moteur', 'enfant', 'senior'] as const
const NOTIF_MODES = ['zen', 'normal', 'actif', 'silencieux'] as const
const LANGS = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ko', 'hi', 'ru', 'tr', 'nl', 'pl', 'sv'] as const

const BodySchema = z
  .object({
    full_name: z.string().trim().min(1).max(80).optional(),
    avatar_url: z.string().trim().url().max(500).optional().or(z.literal('')),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    country: z.string().trim().max(80).optional().or(z.literal('')),
    region: z.string().trim().max(80).optional().or(z.literal('')),
    lang: z.enum(LANGS).optional(),
    theme: z.enum(THEMES).optional(),
    accessibility_mode: z.enum(ACCESS_MODES).optional(),
    notification_mode: z.enum(NOTIF_MODES).optional(),
    multisensorial_enabled: z.boolean().optional(),
  })
  .strict()

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

  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue
    patch[k] = v === '' ? null : v
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select('id, full_name, avatar_url, city, country, region, lang, theme, accessibility_mode, notification_mode, multisensorial_enabled')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Impossible de mettre à jour le profil.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, profile: data })
}
