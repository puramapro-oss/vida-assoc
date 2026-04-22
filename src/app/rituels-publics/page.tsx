import Link from 'next/link'
import { ArrowLeft, Sparkles, Users, Clock, Heart } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Ritual } from '@/types'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Rituels collectifs — Sangha',
  description:
    'Calendrier public des rituels collectifs Sangha : pleine lune, portails \u00e9nerg\u00e9tiques, rituels de paix et d\u2019amour. Rejoins la vibration.',
  alternates: { canonical: `${APP_URL}/rituels-publics` },
  openGraph: {
    title: 'Rituels collectifs Sangha',
    description: 'Vis les rituels collectifs en direct avec la communauté Sangha.',
    url: `${APP_URL}/rituels-publics`,
    type: 'website',
  },
}

export const revalidate = 60

const TYPE_LABELS: Record<string, string> = {
  pleine_lune: 'Pleine lune',
  portail_energetique: 'Portail énergétique',
  depollution: 'Dépollution mondiale',
  paix: 'Paix mondiale',
  amour: 'Amour universel',
  pardon: 'Pardon',
  gratitude: 'Gratitude',
  abondance: 'Abondance',
  soin_collectif: 'Soin collectif',
}

const TYPE_EMOJI: Record<string, string> = {
  pleine_lune: '🌕',
  portail_energetique: '🌀',
  depollution: '🌍',
  paix: '🕊️',
  amour: '💚',
  pardon: '🤲',
  gratitude: '🙏',
  abondance: '🌾',
  soin_collectif: '✨',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PublicRitualsPage() {
  const sb = await createServerSupabaseClient()
  const nowIso = new Date().toISOString()

  const { data } = await sb
    .from('rituals')
    .select('id, title, description, type, intention, scheduled_at, duration_minutes, participants_count, status, image_url')
    .in('status', ['upcoming', 'live'])
    .gte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(20)

  const rituals = (data as Ritual[] | null) ?? []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Rituels collectifs Sangha',
    itemListElement: rituals.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: r.title,
        description: r.description ?? r.intention,
        startDate: r.scheduled_at,
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        eventStatus: r.status === 'live' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventScheduled',
        location: { '@type': 'VirtualLocation', url: `${APP_URL}/dashboard/rituels` },
        organizer: { '@type': 'Organization', name: 'Sangha' },
      },
    })),
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--cyan)]">
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Link>

        <header className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)]">
            <Sparkles className="h-3 w-3 text-[#D4AF37]" />
            Rituels collectifs à venir
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold text-[var(--text-primary)]">
            La communauté en vibration
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Chaque semaine, Sangha rassemble la famille autour d'une intention. Gratuit, guidé, bienveillant.
          </p>
          <div className="mt-6">
            <Link
              href="/login?next=/dashboard/rituels"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[var(--cyan)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 transition-opacity hover:opacity-90"
            >
              <Heart className="h-4 w-4" /> Rejoindre le prochain rituel
            </Link>
          </div>
        </header>

        {rituals.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-[var(--text-muted)]">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-[#D4AF37]" />
            Le prochain rituel est en préparation. Reviens dans quelques heures — la famille Sangha se retrouve régulièrement.
          </div>
        ) : (
          <ul className="space-y-4">
            {rituals.map((r) => {
              const emoji = TYPE_EMOJI[r.type] ?? '✨'
              const label = TYPE_LABELS[r.type] ?? r.type
              return (
                <li key={r.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#D4AF37]/20 to-[var(--purple)]/20 text-4xl">
                      {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                          {label}
                        </span>
                        {r.status === 'live' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-300">
                            ● En direct
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
                        {r.title}
                      </h2>
                      <p className="mt-1 text-sm italic text-[var(--text-secondary)]">« {r.intention} »</p>
                      {r.description && <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.description}</p>}

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(r.scheduled_at)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.duration_minutes} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {(r.participants_count ?? 0).toLocaleString('fr-FR')} voyageurs inscrits
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/login?next=/dashboard/rituels"
                      className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      data-testid="public-ritual-join"
                    >
                      Je participe
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
