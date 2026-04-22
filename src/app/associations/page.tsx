import Link from 'next/link'
import { ArrowLeft, Heart, MapPin, Sparkles, HandHeart, Search } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Association } from '@/types'
import { APP_URL } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Associations vérifiées — Sangha',
  description:
    'Découvre les associations soutenues par la communauté Sangha. Dons sécurisés, impact tracé, transparence totale.',
  alternates: { canonical: `${APP_URL}/associations` },
  openGraph: {
    title: 'Associations vérifiées — Sangha',
    description: 'Toutes les associations partenaires de Sangha, vérifiées, transparentes.',
    url: `${APP_URL}/associations`,
    type: 'website',
  },
}

export const revalidate = 60 // ISR 60s

export default async function AssociationsPublicPage() {
  const sb = await createServerSupabaseClient()
  const { data } = await sb
    .from('associations')
    .select('id, slug, name, vida_name, logo_url, description, category, verified, city, country, impact_score, missions_count, donations_received_cents, volunteers_count, featured')
    .eq('verified', true)
    .order('featured', { ascending: false })
    .order('impact_score', { ascending: false })
    .limit(100)

  const associations = (data as Association[] | null) ?? []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Associations vérifiées Sangha',
    description: metadata.description,
    url: `${APP_URL}/associations`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: associations.slice(0, 30).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'NGO',
          name: a.name,
          url: `${APP_URL}/dashboard/associations/${a.slug}`,
          description: a.description ?? undefined,
          address: a.city ? { '@type': 'PostalAddress', addressLocality: a.city, addressCountry: a.country ?? 'FR' } : undefined,
        },
      })),
    },
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--cyan)]">
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Link>

        <header className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)]">
            <Sparkles className="h-3 w-3 text-[var(--cyan)]" />
            {associations.length} associations vérifiées
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold text-[var(--text-primary)]">
            Les associations qui changent le monde
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Toutes vérifiées, toutes transparentes. Sangha ne prend <strong className="text-[var(--cyan)]">aucune commission</strong> sur tes dons.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login?next=/dashboard/associations"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--cyan)]/20 transition-opacity hover:opacity-90"
            >
              <Heart className="h-4 w-4" /> Soutenir une association
            </Link>
            <Link
              href="/impact-global"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:border-white/20"
            >
              Voir l’impact global
            </Link>
          </div>
        </header>

        {associations.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-[var(--text-muted)]">
            <Search className="mx-auto mb-3 h-6 w-6" />
            Les associations arrivent. Reviens dans quelques minutes — la communauté s’étoffe chaque jour.
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {associations.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/associations/${a.slug}`}
                  className="group block h-full rounded-3xl border border-white/10 bg-white/5 p-5 transition-all hover:border-[var(--cyan)]/40 hover:bg-white/10"
                  data-testid="public-asso-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--cyan)]/20 to-[var(--purple)]/20 text-2xl">
                      {a.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.logo_url} alt={a.name} className="h-full w-full object-cover" />
                      ) : (
                        '🤲'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--text-primary)] group-hover:text-[var(--cyan)]">{a.name}</p>
                      {a.category && (
                        <span className="mt-1 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                          {a.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {a.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{a.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    {a.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {a.city}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <HandHeart className="h-3 w-3" /> {formatPrice(a.donations_received_cents ?? 0)} reçus
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {(a.impact_score ?? 0).toLocaleString('fr-FR')} impact
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
