'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import EmptyState from '@/components/ui/EmptyState'

interface LeaderboardEntry {
  user_id: string
  lifetime_earned: number
  balance: number
  profiles: {
    full_name: string | null
    avatar: string | null
  } | null
}

function formatPoints(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' M pts'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + ' K pts'
  return n.toLocaleString('fr-FR') + ' pts'
}

function Avatar({ name, avatar, size = 'md' }: { name: string | null; avatar: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initial = (name ?? '?').charAt(0).toUpperCase()
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-xl' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name ?? 'Utilisateur'}
        className={`${sizeClass} rounded-full object-cover border border-white/10`}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold border border-white/10`}
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(212,175,55,0.2))',
        color: '#D4AF37',
      }}
    >
      {initial}
    </div>
  )
}

const PODIUM_CONFIG = [
  { rank: 1, label: '1er', icon: Trophy, color: '#D4AF37', bgFrom: '#D4AF37', size: 'lg' as const, order: 'order-2', height: 'h-20' },
  { rank: 2, label: '2ème', icon: Medal, color: '#9CA3AF', bgFrom: '#9CA3AF', size: 'md' as const, order: 'order-1', height: 'h-12' },
  { rank: 3, label: '3ème', icon: Star, color: '#CD7F32', bgFrom: '#CD7F32', size: 'md' as const, order: 'order-3', height: 'h-8' },
]

export default function ClassementPointsPage() {
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number | null>(null)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const { data } = await sb
        .from('purama_points')
        .select('user_id, lifetime_earned, balance, profiles(full_name, avatar)')
        .order('lifetime_earned', { ascending: false })
        .limit(50)

      const list = (data as LeaderboardEntry[] | null) ?? []
      setEntries(list)

      if (user) {
        const idx = list.findIndex((e) => e.user_id === user.id)
        setUserRank(idx === -1 ? null : idx + 1)
      }
      setLoading(false)
    })()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center text-[var(--text-muted)]">
        Chargement du classement…
      </div>
    )
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10" data-testid="classement-points-page">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
            Classement des points
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Top 50 membres VIDA — points gagnés depuis l'inscription.
          </p>
        </div>
      </header>

      {/* User rank pill */}
      {user && userRank !== null && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-2 text-sm text-[#10B981]"
          data-testid="my-rank-badge"
        >
          <Trophy className="h-4 w-4" />
          Tu es classé{userRank <= 3 ? ' sur le podium' : ''} <strong>#{userRank}</strong> sur ce classement
        </motion.div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Pas encore de classement"
          description="Gagne des points pour apparaître ici !"
        />
      ) : (
        <>
          {/* Podium top 3 */}
          {top3.length > 0 && (
            <section aria-label="Podium top 3">
              <div className="flex items-end justify-center gap-4 pt-4 pb-2">
                {PODIUM_CONFIG.map((cfg) => {
                  const entry = top3[cfg.rank - 1]
                  if (!entry) return null
                  const Icon = cfg.icon
                  const isCurrentUser = user?.id === entry.user_id
                  const name = entry.profiles?.full_name ?? 'Utilisateur'

                  return (
                    <motion.div
                      key={cfg.rank}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (cfg.rank - 1) * 0.1 }}
                      className={`flex flex-col items-center gap-2 ${cfg.order}`}
                      data-testid={`podium-rank-${cfg.rank}`}
                    >
                      <Avatar
                        name={name}
                        avatar={entry.profiles?.avatar ?? null}
                        size={cfg.size}
                      />
                      <p
                        className={`text-center text-xs font-semibold max-w-[80px] truncate ${
                          isCurrentUser ? 'text-[#10B981]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {isCurrentUser ? 'Toi' : name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {formatPoints(entry.lifetime_earned)}
                      </p>
                      {/* Podium block */}
                      <div
                        className={`w-20 ${cfg.height} rounded-t-xl flex items-center justify-center`}
                        style={{
                          background: `linear-gradient(to top, ${cfg.bgFrom}22, ${cfg.bgFrom}44)`,
                          border: `1px solid ${cfg.color}33`,
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Ranks 4–50 */}
          {rest.length > 0 && (
            <section aria-label="Classement complet">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">
                Classement complet
              </h2>
              <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
                {rest.map((entry, idx) => {
                  const rank = idx + 4
                  const isCurrentUser = user?.id === entry.user_id
                  const name = entry.profiles?.full_name ?? 'Utilisateur'

                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                        isCurrentUser
                          ? 'bg-[#10B981]/8 border-l-2 border-l-[#10B981]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                      data-testid={isCurrentUser ? 'my-rank-row' : 'leaderboard-row'}
                    >
                      {/* Rank number */}
                      <span
                        className={`shrink-0 w-8 text-center font-mono text-sm font-semibold ${
                          isCurrentUser ? 'text-[#10B981]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {rank}
                      </span>

                      {/* Avatar */}
                      <Avatar
                        name={name}
                        avatar={entry.profiles?.avatar ?? null}
                        size="sm"
                      />

                      {/* Name */}
                      <p
                        className={`flex-1 truncate font-medium ${
                          isCurrentUser ? 'text-[#10B981]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {isCurrentUser ? 'Toi' : name}
                      </p>

                      {/* Points */}
                      <p
                        className={`shrink-0 font-semibold tabular-nums ${
                          isCurrentUser ? 'text-[#10B981]' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {formatPoints(entry.lifetime_earned)}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-[var(--text-muted)] flex items-start gap-2">
        <Star className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <p>
          Le classement est basé sur le total de points gagnés depuis ton inscription. Complète des
          missions, parraine des amis et maintiens ton streak pour grimper dans le classement.
        </p>
      </footer>
    </div>
  )
}
