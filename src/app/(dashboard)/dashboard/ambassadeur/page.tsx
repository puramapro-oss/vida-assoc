'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Award, GraduationCap, Users, Copy, ExternalLink } from 'lucide-react'
import { AmbassadorTier, TIERS, type AmbassadorTierKey } from '@/components/engagement/AmbassadorTier'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface AmbStats {
  clicks: number
  signups: number
  conversions: number
  revenue_cents: number
  conversion_rate: number
  active_referrals: number
}

export default function AmbassadeurPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<AmbStats>({
    clicks: 0, signups: 0, conversions: 0, revenue_cents: 0, conversion_rate: 0, active_referrals: 0,
  })
  const [copied, setCopied] = useState(false)

  const code = profile?.referral_code ?? 'SANGHA'
  const link = `https://vida-assoc.purama.dev/r/${code}`

  useEffect(() => {
    if (!profile) return
    const sb = createClient()
    ;(async () => {
      const [clicksRes, salesRes] = await Promise.all([
        sb.from('influencer_clicks').select('id', { count: 'exact', head: true }),
        sb.from('influencer_sales').select('commission_amount_cents'),
      ])
      const commissions = salesRes.data ?? []
      const revenue = commissions.reduce((s: number, c: { commission_amount_cents?: number }) => s + (c.commission_amount_cents ?? 0), 0)
      const active = (await sb.from('referrals').select('id', { count: 'exact', head: true }).eq('status', 'active')).count ?? 0
      setStats({
        clicks: clicksRes.count ?? 0,
        signups: 0,
        conversions: commissions.length,
        revenue_cents: revenue,
        conversion_rate: clicksRes.count ? Math.round((commissions.length / clicksRes.count) * 100) : 0,
        active_referrals: active,
      })
    })()
  }, [profile])

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-fuchsia-600 text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Programme Ambassadeur</h1>
            <p className="text-sm text-[var(--text-muted)]">
              8 paliers Bronze → Éternel. Commission 50 % premier abo filleul + 10 % à vie. Academy 3 niveaux.
            </p>
          </div>
        </div>
      </motion.section>

      <AmbassadorTier activeReferrals={stats.active_referrals} />

      <section className="grid md:grid-cols-3 gap-4">
        <StatCard label="Clics" value={String(stats.clicks)} />
        <StatCard label="Filleuls actifs" value={String(stats.active_referrals)} />
        <StatCard label="Commissions" value={`${(stats.revenue_cents / 100).toFixed(2)}€`} />
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Mon lien ambassadeur</h2>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={copyLink}
            className="rounded-xl bg-gradient-to-br from-amber-500 to-fuchsia-600 text-white px-4 py-2 text-sm font-medium inline-flex items-center gap-1"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Ton filleul obtient -50 % son 1<sup>er</sup> mois. Tu reçois 50 % de son 1<sup>er</sup> abo + 10 % à vie + carte Purama offerte à vie dès 10 filleuls actifs.
        </p>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-amber-400" />
          <h2 className="font-semibold">Academy Ambassadeur</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <AcademyLevel level={1} title="Fondations" duration="2h" unlocked />
          <AcademyLevel level={2} title="Croissance" duration="6h" unlocked={stats.active_referrals >= 10} />
          <AcademyLevel level={3} title="Maîtrise" duration="12h" unlocked={stats.active_referrals >= 50} />
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-amber-400" />
          <h2 className="font-semibold">Grille paliers complète</h2>
        </div>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--text-muted)] border-b border-white/5">
                <th className="py-2">Palier</th>
                <th>Seuil</th>
                <th>Commission</th>
                <th>Avantage</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.slice(1).map((t) => (
                <tr key={t.key} className="border-b border-white/5 last:border-0">
                  <td className="py-2 font-medium">
                    <span className={t.color}>●</span> {t.label}
                  </td>
                  <td className="text-[var(--text-muted)]">{t.threshold}+</td>
                  <td>+{t.commissionBase}%</td>
                  <td className="text-xs text-[var(--text-muted)]">{getAdvantage(t.key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
        Ancien <code>/dashboard/influenceur</code> renommé Ambassadeur.
        <Link href="/dashboard/influenceur" className="text-cyan-400 hover:underline inline-flex items-center gap-1">
          Accéder <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold font-[family-name:var(--font-display)]">{value}</p>
    </div>
  )
}

function AcademyLevel({ level, title, duration, unlocked }: { level: number; title: string; duration: string; unlocked?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${unlocked ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
      <p className="text-xs text-[var(--text-muted)]">Niv {level} · {duration}</p>
      <p className="mt-1 font-semibold">{title}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {unlocked ? 'Débloqué' : level === 2 ? '10 filleuls actifs requis' : '50 filleuls actifs requis'}
      </p>
    </div>
  )
}

function getAdvantage(key: AmbassadorTierKey): string {
  switch (key) {
    case 'bronze':   return 'Starter GRATUIT à vie'
    case 'silver':   return 'Pro + early access 7j'
    case 'gold':     return 'Unlimited + page perso'
    case 'platinum': return 'Enterprise + feature prio'
    case 'diamond':  return 'Purama Card VIP à vie'
    case 'legend':   return 'Commissions héréditaires'
    case 'titan':    return 'Ligne produit Tissma'
    case 'eternal':  return '1 % parts + héréditaire'
    default: return ''
  }
}
