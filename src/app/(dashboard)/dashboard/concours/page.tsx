'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Ticket, CalendarClock, Sparkles, ArrowUpRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { formatPrice, timeUntil } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Contest } from '@/types'

interface LeaderboardRow {
  user_id: string
  score: number
  rank: number
  user?: { full_name: string | null; email: string }
}

const TYPE_LABELS: Record<Contest['type'], { label: string; emoji: string }> = {
  weekly:  { label: 'Hebdomadaire', emoji: '⚡️' },
  monthly: { label: 'Mensuel',      emoji: '🌙' },
  yearly:  { label: 'Annuel',       emoji: '🎆' },
  special: { label: 'Spécial',      emoji: '✨' },
}

export default function ConcoursPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [contests, setContests] = useState<Contest[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  const myTickets = profile?.contest_tickets ?? 0

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const [c, lb] = await Promise.all([
        sb
          .from('contests')
          .select('*')
          .in('status', ['live', 'upcoming'])
          .order('start_date', { ascending: true })
          .limit(20),
        sb
          .from('leaderboards')
          .select('user_id, score, rank, user:user_id(full_name, email)')
          .eq('period', 'weekly')
          .eq('scope', 'global')
          .eq('category', 'missions')
          .order('rank', { ascending: true })
          .limit(10),
      ])
      setContests((c.data as Contest[] | null) ?? [])
      setLeaderboard((lb.data as unknown as LeaderboardRow[] | null) ?? [])
      setLoading(false)
    })()
  }, [])

  const live = useMemo(() => contests.filter((c) => c.status === 'live'), [contests])
  const upcoming = useMemo(() => contests.filter((c) => c.status === 'upcoming'), [contests])

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Chargement des concours…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="concours-page">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Concours</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            10 gagnants à chaque tirage. Aucune chance ne dort, chaque action compte.
          </p>
        </div>
      </header>

      {/* Mes tickets */}
      <section
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-400/10 via-transparent to-[var(--purple)]/5 p-6 md:p-8"
        data-testid="my-tickets"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-2xl">🎟️</div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Mes tickets</p>
              <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">{myTickets}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Tirage le plus proche</p>
            <p className="text-sm font-semibold text-amber-300">
              {live[0] ? timeUntil(live[0].end_date) : 'aucun en cours'}
            </p>
          </div>
          <div className="text-right">
            <Link
              href="/dashboard/concours/resultats"
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-amber-300 hover:text-amber-200 transition"
              data-testid="link-resultats"
            >
              Derniers résultats <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Gagne des tickets en réalisant des missions, en parrainant un ami ou en partageant ton lien VIDA.
        </p>
      </section>

      {/* Live */}
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">En cours</h2>
        {live.length === 0 ? (
          <EmptyState icon="🎯" title="Aucun concours en cours" description="Reviens vite, le prochain démarre bientôt." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.map((c, i) => (
              <ContestCard key={c.id} contest={c} index={i} userId={user?.id} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">À venir</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((c, i) => (
              <ContestCard key={c.id} contest={c} index={i} upcoming />
            ))}
          </div>
        </section>
      )}

      {/* Classement */}
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" /> Classement de la semaine
        </h2>
        {leaderboard.length === 0 ? (
          <EmptyState icon="🌟" title="Classement bientôt disponible" description="Complète des missions pour entrer dans le top 10." />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
            {leaderboard.map((row) => {
              const isMe = row.user_id === user?.id
              const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `${row.rank}.`
              return (
                <div
                  key={row.user_id}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${isMe ? 'bg-amber-300/5' : ''}`}
                >
                  <span className="w-8 text-center text-base">{medal}</span>
                  <span className="flex-1 truncate text-[var(--text-primary)]">
                    {row.user?.full_name || row.user?.email || 'Voyageur'}{isMe && ' (toi)'}
                  </span>
                  <span className="font-semibold text-amber-200">{row.score} pts</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function ContestCard({ contest, index, upcoming, userId }: { contest: Contest; index: number; upcoming?: boolean; userId?: string }) {
  const meta = TYPE_LABELS[contest.type] ?? TYPE_LABELS.special
  const rank1 = contest.prizes?.[0]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-amber-300/40 transition"
      data-testid="contest-card"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
          {meta.emoji} {meta.label}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <CalendarClock className="h-3 w-3" />
          {upcoming ? `démarre ${timeUntil(contest.start_date)}` : `clôture ${timeUntil(contest.end_date)}`}
        </span>
      </div>
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
        {contest.title}
      </h3>
      {contest.description && (
        <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{contest.description}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Cagnotte</p>
          <p className="mt-1 text-base font-semibold text-amber-200">{formatPrice(contest.total_pool_cents)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">1er prix</p>
          <p className="mt-1 line-clamp-1 text-base font-semibold text-[var(--text-primary)]">
            {rank1 ? rank1.description : '—'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1"><Ticket className="h-3 w-3" /> 10 gagnants</span>
        {userId && <span>Participation automatique</span>}
      </div>
    </motion.div>
  )
}
