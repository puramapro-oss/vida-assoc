'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Globe, Sparkles, Trophy, ArrowRight, Leaf, HandHeart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { formatCredits, formatPrice, levelFromImpactScore, getGreeting } from '@/lib/utils'
import type { Mission, Ritual, Contest, ImpactGlobal } from '@/types'

export default function DashboardHome() {
  const { profile, loading } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [ritual, setRitual] = useState<Ritual | null>(null)
  const [contest, setContest] = useState<Contest | null>(null)
  const [globalImpact, setGlobalImpact] = useState<ImpactGlobal | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const [m, r, c, g] = await Promise.all([
        sb.from('missions').select('*').eq('status', 'active').eq('is_public', true).order('created_at', { ascending: false }).limit(6),
        sb.from('rituals').select('*').eq('status', 'upcoming').order('scheduled_at').limit(1).maybeSingle(),
        sb.from('contests').select('*').eq('status', 'live').order('type').limit(1).maybeSingle(),
        sb.from('impact_global').select('*').order('date', { ascending: false }).limit(1).maybeSingle(),
      ])
      setMissions((m.data as Mission[] | null) ?? [])
      setRitual((r.data as Ritual | null) ?? null)
      setContest((c.data as Contest | null) ?? null)
      setGlobalImpact((g.data as ImpactGlobal | null) ?? null)
      setLoadingData(false)
    })()
  }, [])

  const level = levelFromImpactScore(profile?.impact_score ?? 0)
  const name = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'cœur lumineux'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
        Chargement de ton mouvement…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="dashboard-home">
      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm text-[var(--text-muted)]">{getGreeting()},</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
          <span className="text-[var(--text-primary)]">{name}</span> <span aria-hidden>{level.emoji}</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Niveau <span className="text-[#10B981] font-semibold">{level.name}</span> — {Math.round(level.progress * 100)} % vers le suivant
        </p>
        <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#10B981] to-[#D4AF37] transition-all" style={{ width: `${level.progress * 100}%` }} />
        </div>
      </motion.header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Leaf} label="Crédits VIDA" value={formatCredits(profile?.vida_credits ?? 0)} color="#10B981" />
        <StatCard icon={Heart} label="Missions faites" value={String(profile?.total_missions_completed ?? 0)} color="#D4AF37" />
        <StatCard icon={Trophy} label="Tickets concours" value={String(profile?.contest_tickets ?? 0)} color="#a855f7" />
        <StatCard icon={HandHeart} label="Wallet" value={formatPrice(profile?.wallet_balance_cents ?? 0)} color="#60a5fa" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction href="/dashboard/missions" icon={Globe} title="Voir les missions" desc="Choisis ta prochaine action" gradient="from-[#10B981] to-[#34D399]" />
        <QuickAction href="/dashboard/dons" icon={HandHeart} title="Faire un don" desc="Toutes les associations unies" gradient="from-[#D4AF37] to-[#F59E0B]" />
        <QuickAction href="/dashboard/rituels" icon={Sparkles} title="Rituels collectifs" desc="Une fois par semaine" gradient="from-[#a855f7] to-[#c084fc]" />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Missions recommandées</h2>
          <Link href="/dashboard/missions" className="text-sm text-[#10B981] hover:underline inline-flex items-center gap-1" data-testid="see-all-missions">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loadingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-[var(--text-muted)]">
            Aucune mission active pour l&apos;instant. Reviens bientôt.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {missions.slice(0, 6).map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/missions/${m.id}`}
                className="glass rounded-2xl p-5 hover:border-[#10B981]/30 transition-colors group"
                data-testid={`mission-card-${m.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981]/10 text-[#10B981]">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="text-xs text-[#D4AF37]">
                    {m.reward_type === 'money' ? formatPrice(m.reward_amount_cents) : `+${m.reward_vida_credits} crédits`}
                  </div>
                </div>
                <h3 className="mt-4 font-semibold line-clamp-1 group-hover:text-[#10B981] transition-colors">{m.title}</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">{m.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {m.duration_minutes && <span>⏱️ {m.duration_minutes} min</span>}
                  {m.difficulty && <span>· {m.difficulty}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ritual && (
          <div className="glass rounded-2xl p-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#a855f7]">
              <Sparkles className="h-3 w-3" /> Rituel à venir
            </div>
            <h3 className="mt-2 text-lg font-semibold">{ritual.title}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">{ritual.intention}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">+{ritual.reward_vida_credits} crédits</span>
              <Link href="/dashboard/rituels" className="text-sm text-[#10B981] hover:underline inline-flex items-center gap-1">
                Participer <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
        {contest && (
          <div className="glass rounded-2xl p-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#D4AF37]">
              <Trophy className="h-3 w-3" /> Concours {contest.type === 'weekly' ? 'hebdo' : contest.type === 'monthly' ? 'mensuel' : ''}
            </div>
            <h3 className="mt-2 text-lg font-semibold">{contest.title}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">{contest.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Pool : {formatPrice(contest.total_pool_cents)}</span>
              <Link href="/dashboard/concours" className="text-sm text-[#10B981] hover:underline inline-flex items-center gap-1">
                Participer <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {globalImpact && (
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Impact collectif aujourd&apos;hui</h2>
            <Link href="/dashboard/impact" className="text-sm text-[#10B981] hover:underline inline-flex items-center gap-1">
              Détails <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ImpactTile label="Missions" value={String(globalImpact.total_missions)} emoji="🎯" />
            <ImpactTile label="Déchets kg" value={Number(globalImpact.total_waste_kg ?? 0).toFixed(1)} emoji="♻️" />
            <ImpactTile label="Arbres" value={String(globalImpact.total_trees)} emoji="🌳" />
            <ImpactTile label="Personnes aidées" value={String(globalImpact.total_people_helped)} emoji="🤝" />
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Heart; label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}20`, color }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className="text-lg font-semibold truncate">{value}</p>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, title, desc, gradient }: { href: string; icon: typeof Heart; title: string; desc: string; gradient: string }) {
  return (
    <Link href={href} className="glass rounded-2xl p-5 hover:border-white/20 transition-colors group block">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold group-hover:text-[#10B981] transition-colors">{title}</h3>
      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
    </Link>
  )
}

function ImpactTile({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl" aria-hidden>{emoji}</div>
      <div className="mt-2 text-2xl font-bold font-[family-name:var(--font-display)]">{value}</div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  )
}
