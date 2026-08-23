'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Contest } from '@/types'

interface WinnerRow {
  id: string
  contest_id: string
  user_id: string
  rank: number
  prize_description: string | null
  prize_value_cents: number
  created_at: string
  user?: { full_name: string | null; email: string }
}

interface ContestWithWinners extends Contest {
  winners: WinnerRow[]
}

export default function ResultatsPage() {
  const [data, setData] = useState<ContestWithWinners[]>([])
  const [loading, setLoading] = useState(true)
  const [confettiOn, setConfettiOn] = useState(false)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const { data: contests } = await sb
        .from('contests')
        .select('*')
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
        .limit(8)

      const ids = (contests as Contest[] | null)?.map((c) => c.id) ?? []
      let winners: WinnerRow[] = []
      if (ids.length) {
        const { data: ws } = await sb
          .from('contest_winners')
          .select('*, user:user_id(full_name, email)')
          .in('contest_id', ids)
          .order('rank', { ascending: true })
        winners = (ws as unknown as WinnerRow[] | null) ?? []
      }

      const merged: ContestWithWinners[] = ((contests as Contest[] | null) ?? []).map((c) => ({
        ...c,
        winners: winners.filter((w) => w.contest_id === c.id),
      }))
      setData(merged)
      setLoading(false)
      if (merged.length > 0) {
        setConfettiOn(true)
        setTimeout(() => setConfettiOn(false), 2400)
      }
    })()
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10" data-testid="resultats-page">
      <header>
        <Link href="/dashboard/concours" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-3 w-3" /> Retour aux concours
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-amber-300" /> Résultats
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Tous les gagnants des derniers tirages — bravo à eux 🌱
        </p>
      </header>

      {confettiOn && <Confetti />}

      {loading ? (
        <div className="text-center text-[var(--text-muted)] py-12">Chargement…</div>
      ) : data.length === 0 ? (
        <EmptyState
          icon="🌟"
          title="Pas encore de tirage"
          description="Le premier concours sera tiré dimanche soir. Reviens vite !"
        />
      ) : (
        <div className="space-y-6">
          {data.map((c) => (
            <section key={c.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <header className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-amber-200">{c.type}</p>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
                    {c.title}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tiré le {new Date(c.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — cagnotte {formatPrice(c.total_pool_cents)}
                  </p>
                </div>
              </header>

              {c.winners.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--text-muted)]">Tirage en cours de validation.</p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {c.winners.map((w) => {
                    const medal = w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : w.rank === 3 ? '🥉' : `${w.rank}.`
                    return (
                      <li
                        key={w.id}
                        className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                      >
                        <span className="w-8 text-center text-base">{medal}</span>
                        <span className="flex-1 truncate text-[var(--text-primary)]">
                          {w.user?.full_name || w.user?.email || 'Voyageur'}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] line-clamp-1">{w.prize_description ?? '—'}</span>
                        {w.prize_value_cents > 0 && (
                          <span className="font-semibold text-amber-200">{formatPrice(w.prize_value_cents)}</span>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.8 + Math.random(),
      color: ['#FBBF24', '#10B981', '#06B6D4', '#A78BFA', '#F472B6'][i % 5],
    }))
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
          className="absolute top-0 h-2 w-2 rounded-sm"
          style={{ left: `${p.left}%`, backgroundColor: p.color }}
        />
      ))}
    </div>
  )
}
