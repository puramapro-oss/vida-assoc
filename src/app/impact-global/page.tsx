import Link from 'next/link'
import { ArrowLeft, Sparkles, Trees, Droplet, Wind, Users, HandHeart, Heart, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatPrice } from '@/lib/utils'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Impact global — VIDA Association',
  description:
    'L’impact réel de la communauté VIDA : arbres plantés, déchets ramassés, personnes aidées, dons reversés. Transparence totale.',
  alternates: { canonical: `${APP_URL}/impact-global` },
  openGraph: {
    title: 'Impact global — VIDA',
    description: 'Chaque action de la communauté, comptabilisée et transparente.',
    url: `${APP_URL}/impact-global`,
    type: 'website',
  },
}

export const revalidate = 60

type Stat = {
  icon: React.ReactNode
  label: string
  value: string
  accent?: string
}

export default async function ImpactGlobalPage() {
  const sb = await createServerSupabaseClient()

  const [{ count: usersCount }, { data: missionsAgg }, { data: donationsAgg }, { data: impactAgg }] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('total_missions_completed, impact_score'),
    sb.from('donations').select('amount_cents').eq('status', 'succeeded'),
    sb.from('impact_tracker').select('impact_type, impact_value'),
  ])

  const totalUsers = usersCount ?? 0
  const totalMissions = ((missionsAgg as { total_missions_completed: number }[] | null) ?? []).reduce(
    (s, p) => s + (p.total_missions_completed ?? 0),
    0,
  )
  const totalImpact = ((missionsAgg as { impact_score: number }[] | null) ?? []).reduce(
    (s, p) => s + (p.impact_score ?? 0),
    0,
  )
  const totalDonations = ((donationsAgg as { amount_cents: number }[] | null) ?? []).reduce(
    (s, d) => s + (d.amount_cents ?? 0),
    0,
  )

  const impactByType: Record<string, number> = {}
  for (const row of ((impactAgg as { impact_type: string; impact_value: number }[] | null) ?? [])) {
    impactByType[row.impact_type] = (impactByType[row.impact_type] ?? 0) + (row.impact_value ?? 0)
  }

  const stats: Stat[] = [
    { icon: <Users className="h-5 w-5" />,     label: 'Voyageurs VIDA',   value: totalUsers.toLocaleString('fr-FR') },
    { icon: <Sparkles className="h-5 w-5" />,  label: 'Missions accomplies', value: totalMissions.toLocaleString('fr-FR') },
    { icon: <HandHeart className="h-5 w-5" />, label: 'Dons reversés',      value: formatPrice(totalDonations),       accent: 'text-[#D4AF37]' },
    { icon: <Heart className="h-5 w-5" />,     label: 'Impact cumulé',      value: totalImpact.toLocaleString('fr-FR') },
  ]

  const ecoStats: Array<{ icon: React.ReactNode; label: string; value: string; unit: string; color: string }> = [
    { icon: <Wind className="h-5 w-5" />,    label: 'CO₂ évité',       value: (impactByType.co2_saved_kg ?? 0).toLocaleString('fr-FR'),        unit: 'kg',    color: 'text-emerald-300' },
    { icon: <Trash2 className="h-5 w-5" />,  label: 'Déchets collectés', value: (impactByType.waste_collected_kg ?? 0).toLocaleString('fr-FR'), unit: 'kg',    color: 'text-sky-300' },
    { icon: <Droplet className="h-5 w-5" />, label: 'Eau protégée',    value: (impactByType.water_protected_l ?? 0).toLocaleString('fr-FR'),  unit: 'L',     color: 'text-cyan-300' },
    { icon: <Trees className="h-5 w-5" />,   label: 'Arbres plantés',  value: (impactByType.trees_planted ?? 0).toLocaleString('fr-FR'),      unit: '',      color: 'text-green-300' },
    { icon: <Users className="h-5 w-5" />,   label: 'Personnes aidées', value: (impactByType.people_helped ?? 0).toLocaleString('fr-FR'),     unit: '',      color: 'text-rose-300' },
    { icon: <Sparkles className="h-5 w-5" />,label: 'Heures de bénévolat', value: (impactByType.hours_volunteered ?? 0).toLocaleString('fr-FR'), unit: 'h', color: 'text-[#D4AF37]' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VIDA Association',
    url: APP_URL,
    description: metadata.description,
    foundingDate: '2025',
    memberOf: {
      '@type': 'NonprofitType',
      name: 'Association PURAMA',
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
            Transparence totale · mis à jour toutes les minutes
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold text-[var(--text-primary)]">
            L’impact réel<br />
            <span className="gradient-text">de la communauté VIDA</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Chaque mission, chaque don, chaque rituel comptabilisé. VIDA rend des comptes, tous les jours.
          </p>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className={`flex items-center gap-2 ${s.accent ?? 'text-[var(--cyan)]'}`}>
                {s.icon}
                <span className="text-xs uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text-primary)]">
                {s.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold">Planète, vivant, solidarité</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ecoStats.map((s) => (
              <div key={s.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className={`flex items-center gap-2 ${s.color}`}>
                  {s.icon}
                  <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{s.label}</span>
                </div>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                  {s.value} <span className="text-sm text-[var(--text-muted)]">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-[var(--text-secondary)]">
          <p>
            VIDA reverse <strong>100 %</strong> de tes dons aux associations partenaires, <strong>0 commission</strong>. Les missions rémunérées sont payées via le wallet VIDA, retirable en euros dès 5 €. La communauté valide collectivement les impacts, vérifiés par IA + GPS + photo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/associations" className="inline-flex items-center gap-1 text-sm text-[var(--cyan)] hover:underline">
              Annuaire des associations →
            </Link>
            <Link href="/rituels-publics" className="inline-flex items-center gap-1 text-sm text-[var(--cyan)] hover:underline">
              Prochains rituels →
            </Link>
            <Link href="/login?next=/dashboard" className="inline-flex items-center gap-1 text-sm text-[#D4AF37] hover:underline">
              Rejoindre VIDA →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
