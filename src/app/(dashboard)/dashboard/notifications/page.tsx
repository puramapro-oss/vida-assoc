'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCheck, Filter, Sparkles,
  Gift, Trophy, Heart, Share2, HandHeart, Zap, Info, Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { Notification } from '@/types'

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  new_mission:  { icon: <Sparkles className="h-4 w-4" />, color: 'text-[var(--cyan)]' },
  ritual:       { icon: <Sparkles className="h-4 w-4" />, color: 'text-[#D4AF37]' },
  contest:      { icon: <Trophy className="h-4 w-4" />,   color: 'text-amber-300' },
  reward:       { icon: <Gift className="h-4 w-4" />,     color: 'text-emerald-300' },
  impact:       { icon: <Heart className="h-4 w-4" />,    color: 'text-pink-300' },
  donation:     { icon: <HandHeart className="h-4 w-4" />,color: 'text-rose-300' },
  referral:     { icon: <Share2 className="h-4 w-4" />,   color: 'text-sky-300' },
  streak:       { icon: <Zap className="h-4 w-4" />,      color: 'text-orange-300' },
  system:       { icon: <Info className="h-4 w-4" />,     color: 'text-[var(--text-secondary)]' },
  community:    { icon: <Users className="h-4 w-4" />,    color: 'text-fuchsia-300' },
  influencer:   { icon: <Share2 className="h-4 w-4" />,   color: 'text-violet-300' },
  level_up:     { icon: <Trophy className="h-4 w-4" />,   color: 'text-yellow-300' },
}

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l’instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    if (!user) return
    const sb = createClient()
    ;(async () => {
      const { data } = await sb
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      setNotifs((data as Notification[] | null) ?? [])
      setLoading(false)
    })()
  }, [user])

  const visible = useMemo(
    () => (filter === 'unread' ? notifs.filter((n) => !n.read) : notifs),
    [notifs, filter],
  )
  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs])

  async function markOneRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)))
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    } catch {
      /* optimistic — ignore */
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return
    setMarking(true)
    const now = new Date().toISOString()
    setNotifs((prev) => prev.map((n) => (n.read ? n : { ...n, read: true, read_at: now })))
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } finally {
      setMarking(false)
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-3xl py-12 text-center text-[var(--text-muted)]">Chargement des notifications…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState icon="🔒" title="Connecte-toi" description="Retrouve toutes tes notifications après connexion." />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/notifications')}>
          Se connecter
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12" data-testid="notifications-page">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cyan)]/10 text-[var(--cyan)]">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Notifications</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === 'all' ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              data-testid="filter-all"
            >
              <Filter className="mr-1 inline h-3 w-3" />Toutes
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === 'unread' ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              data-testid="filter-unread"
            >
              Non lues
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={markAllRead}
            disabled={unreadCount === 0 || marking}
            loading={marking}
            data-testid="mark-all-read"
          >
            Tout marquer lu
          </Button>
        </div>
      </header>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          icon="🌿"
          title={filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification pour le moment'}
          description="Complète une mission, participe à un rituel ou parraine un ami pour recevoir ton premier signal."
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {visible.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system
              const body = (
                <div className="flex items-start gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ${meta.color}`}>
                    {n.icon ? <span className="text-base">{n.icon}</span> : meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--cyan)]" aria-label="non lue" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{n.body}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{formatAgo(n.created_at)}</p>
                  </div>
                </div>
              )

              return (
                <motion.li
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-2xl border p-4 transition-all ${n.read ? 'border-white/10 bg-white/5' : 'border-[var(--cyan)]/30 bg-[var(--cyan)]/5'}`}
                  data-testid="notif-item"
                >
                  {n.action_url ? (
                    <Link href={n.action_url} onClick={() => !n.read && markOneRead(n.id)} className="block">
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => !n.read && markOneRead(n.id)} className="w-full text-left">
                      {body}
                    </button>
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
