'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Users, Clock, Coins, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useHaptic, useSound432 } from '@/hooks/useMultisensorial'
import { createClient } from '@/lib/supabase'
import { timeUntil } from '@/lib/utils'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { Ritual } from '@/types'

const TYPE_META: Record<Ritual['type'], { emoji: string; color: string }> = {
  pleine_lune:         { emoji: '🌕', color: 'from-indigo-400/20' },
  portail_energetique: { emoji: '🌀', color: 'from-fuchsia-400/20' },
  depollution:         { emoji: '🌊', color: 'from-cyan-400/20' },
  paix:                { emoji: '🕊️', color: 'from-sky-400/20' },
  amour:               { emoji: '💗', color: 'from-pink-400/20' },
  pardon:              { emoji: '🤲', color: 'from-amber-300/20' },
  gratitude:           { emoji: '🙏', color: 'from-emerald-400/20' },
  abondance:           { emoji: '🌾', color: 'from-yellow-300/20' },
  soin_collectif:      { emoji: '💎', color: 'from-violet-300/20' },
}

export default function RituelsPage() {
  const { user, loading: authLoading } = useAuth()
  const haptic = useHaptic()
  const playTone = useSound432()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const [{ data: rs }, parts] = await Promise.all([
        sb
          .from('rituals')
          .select('*')
          .in('status', ['upcoming', 'live'])
          .order('scheduled_at', { ascending: true })
          .limit(20),
        user
          ? sb.from('ritual_participations').select('ritual_id').eq('user_id', user.id)
          : Promise.resolve({ data: [] as { ritual_id: string }[] }),
      ])
      setRituals((rs as Ritual[] | null) ?? [])
      setJoinedIds(new Set(((parts.data as { ritual_id: string }[] | null) ?? []).map((p) => p.ritual_id)))
      setLoading(false)
    })()
  }, [user])

  async function join(ritualId: string) {
    if (!user) {
      window.location.href = '/login?next=/dashboard/rituels'
      return
    }
    setPendingId(ritualId)
    try {
      const res = await fetch('/api/rituals/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ritual_id: ritualId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Inscription impossible')
      setJoinedIds((prev) => new Set(prev).add(ritualId))
      setRituals((prev) =>
        prev.map((r) => (r.id === ritualId ? { ...r, participants_count: (r.participants_count ?? 0) + 1 } : r)),
      )
      haptic('success')
      playTone({ duration: 2.4 })
    } catch {
      // silent — UI button stays clickable
    } finally {
      setPendingId(null)
    }
  }

  const next = useMemo(() => rituals[0], [rituals])

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Préparation des rituels…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="rituels-page">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--purple)]/10 text-[var(--purple)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Rituels collectifs</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Une intention, des milliers de cœurs synchronisés. Choisis ton rituel et rejoins l’élan.
          </p>
        </div>
      </header>

      {next && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8"
        >
          <div className={`absolute inset-0 -z-10 opacity-30 bg-gradient-to-br ${TYPE_META[next.type]?.color ?? 'from-cyan-400/20'} to-transparent`} />
          <div className="flex items-start gap-4">
            <div className="text-4xl">{TYPE_META[next.type]?.emoji ?? '✨'}</div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Prochain rituel</p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
                {next.title}
              </h2>
              <p className="mt-1 text-sm italic text-[var(--text-secondary)]">« {next.intention} »</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeUntil(next.scheduled_at)} · {next.duration_minutes} min</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {next.participants_count} âmes</span>
                <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-[#D4AF37]" /> +{next.reward_vida_credits} crédits</span>
              </div>
            </div>
            <Button
              onClick={() => join(next.id)}
              disabled={joinedIds.has(next.id) || pendingId === next.id}
              data-testid="join-ritual-hero"
            >
              {joinedIds.has(next.id) ? (
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Inscrit</span>
              ) : pendingId === next.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Je participe'
              )}
            </Button>
          </div>
        </motion.section>
      )}

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">Tous les rituels à venir</h2>
        {rituals.length === 0 ? (
          <EmptyState icon="🌙" title="Aucun rituel programmé" description="Le calendrier des prochains rituels arrive bientôt." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rituals.map((r, i) => {
              const joined = joinedIds.has(r.id)
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  data-testid="ritual-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{TYPE_META[r.type]?.emoji ?? '✨'}</span>
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
                          {r.title}
                        </h3>
                        <p className="mt-0.5 text-xs italic text-[var(--text-secondary)] line-clamp-2">« {r.intention} »</p>
                      </div>
                    </div>
                    {r.status === 'live' && (
                      <span className="rounded-full bg-[var(--green)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--green)]">
                        EN DIRECT
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeUntil(r.scheduled_at)} · {r.duration_minutes} min</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {r.participants_count}</span>
                    <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-[#D4AF37]" /> +{r.reward_vida_credits}</span>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant={joined ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => join(r.id)}
                      disabled={joined || pendingId === r.id}
                      className="w-full"
                      data-testid="join-ritual"
                    >
                      {joined ? (
                        <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Inscrit</span>
                      ) : pendingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Je participe'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
