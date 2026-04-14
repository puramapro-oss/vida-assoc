'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Clock, Sparkles, ArrowRight, Filter } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { MISSION_CATEGORIES } from '@/lib/constants'
import { formatPrice, formatCredits } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Mission } from '@/types'

type Difficulty = Mission['difficulty']
type DifficultyFilter = 'all' | NonNullable<Difficulty>

const DIFFICULTY_LABELS: Record<NonNullable<Difficulty>, { label: string; color: string }> = {
  facile: { label: 'Facile', color: '#86efac' },
  moyen: { label: 'Moyen', color: '#fbbf24' },
  difficile: { label: 'Difficile', color: '#f97316' },
  expert: { label: 'Expert', color: '#ef4444' },
}

export default function MissionsListPage() {
  const { loading: authLoading } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const sb = createClient()
    sb.from('missions')
      .select('*')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setMissions((data as Mission[] | null) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return missions.filter((m) => {
      if (category !== 'all' && m.category_id !== category) return false
      if (difficulty !== 'all' && m.difficulty !== difficulty) return false
      if (q && !`${m.title} ${m.description}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [missions, search, category, difficulty])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10" data-testid="missions-page">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
          Missions <span className="text-[#10B981]">vivantes</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Choisis ton action. Chaque geste compte, chaque preuve est tracée.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une mission, un lieu, un thème…"
              data-testid="missions-search"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#10B981] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            data-testid="missions-toggle-filters"
            className="rounded-xl border border-white/10 bg-white/5 px-4 text-[var(--text-secondary)] hover:bg-white/10"
            aria-label="Filtres"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Difficulté</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'facile', 'moyen', 'difficile', 'expert'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      difficulty === d
                        ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                        : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                    }`}
                  >
                    {d === 'all' ? 'Toutes' : DIFFICULTY_LABELS[d].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Catégorie</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    category === 'all'
                      ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                      : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                  }`}
                >
                  Toutes
                </button>
                {MISSION_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      category === c.id
                        ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                        : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                    }`}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="Aucune mission ne correspond"
          description="Essaie de retirer un filtre ou cherche une autre catégorie."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, i) => (
            <MissionCard key={m.id} mission={m} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function MissionCard({ mission, index }: { mission: Mission; index: number }) {
  const cat = MISSION_CATEGORIES.find((c) => c.id === mission.category_id)
  const diff = mission.difficulty ? DIFFICULTY_LABELS[mission.difficulty] : null
  const reward =
    mission.reward_amount_cents > 0
      ? formatPrice(mission.reward_amount_cents)
      : mission.reward_vida_credits > 0
      ? formatCredits(mission.reward_vida_credits)
      : mission.reward_contest_tickets > 0
      ? `${mission.reward_contest_tickets} ticket${mission.reward_contest_tickets > 1 ? 's' : ''} concours`
      : 'Cœur lumineux'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        href={`/dashboard/missions/${mission.id}`}
        data-testid="mission-card"
        className="group block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#10B981]/40 hover:bg-white/[0.07]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {cat?.icon ?? '✨'}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{cat?.name ?? mission.type}</p>
              {diff && (
                <span
                  className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${diff.color}22`, color: diff.color }}
                >
                  {diff.label}
                </span>
              )}
            </div>
          </div>
          {mission.featured && <Sparkles className="h-4 w-4 text-[#D4AF37]" />}
        </div>

        <h3 className="mt-3 line-clamp-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] group-hover:text-[#10B981]">
          {mission.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{mission.description}</p>

        <div className="mt-4 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          {mission.location_name && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {mission.location_name}
            </span>
          )}
          {mission.duration_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {mission.duration_minutes} min
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <span className="text-sm font-semibold text-[#D4AF37]">{reward}</span>
          <span className="inline-flex items-center gap-1 text-xs text-[#10B981] group-hover:gap-2 transition-all">
            Je la fais <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
