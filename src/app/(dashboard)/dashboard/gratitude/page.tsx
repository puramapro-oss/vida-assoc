'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, Send, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { GratitudeEntry, PROMPTS, formatTime, groupEntriesByDate } from './utils'

export default function GratitudePage() {
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const promptRef = useRef(0)
  const [prompt, setPrompt] = useState(PROMPTS[0])

  // Rotate prompt on mount and on each successful submit
  const rotatePrompt = useCallback(() => {
    promptRef.current = (promptRef.current + 1) % PROMPTS.length
    setPrompt(PROMPTS[promptRef.current])
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!user) return
    setLoadingEntries(true)
    try {
      const res = await fetch('/api/gratitude')
      const data = await res.json()
      if (res.ok) setEntries(data.entries ?? [])
    } catch {
      // silently fail — entries will stay empty
    } finally {
      setLoadingEntries(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) queueMicrotask(() => fetchEntries())
  }, [authLoading, user, fetchEntries])

  // Today's count
  const todayCount = entries.filter((e) => {
    const d = new Date(e.created_at)
    return d.toDateString() === new Date().toDateString()
  }).length

  const todayEntries = entries.filter((e) => {
    const d = new Date(e.created_at)
    return d.toDateString() === new Date().toDateString()
  })

  const pastEntries = entries.filter((e) => {
    const d = new Date(e.created_at)
    return d.toDateString() !== new Date().toDateString()
  })

  const pastGroups = groupEntriesByDate(pastEntries)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting || todayCount >= 3) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/gratitude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }

      setSuccessId(data.entry.id)
      setContent('')
      rotatePrompt()
      setEntries((prev) => [data.entry, ...prev])
      setTimeout(() => setSuccessId(null), 2000)
    } catch {
      setError('Impossible d\'enregistrer ta gratitude. Vérifie ta connexion.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
        Chargement…
      </div>
    )
  }

  const canSubmit = todayCount < 3 && content.trim().length > 0

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-10" data-testid="gratitude-page">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-[#10B981]" aria-hidden />
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Journal de gratitude
          </h1>
        </div>
        <p className="text-sm text-[var(--text-muted)] pl-8">
          Chaque gratitude élève ton énergie et celle du monde 🌱
        </p>
      </motion.header>

      {/* Entry form */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        aria-label="Nouvelle gratitude"
      >
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-xl p-6 shadow-lg space-y-4">
          {/* Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" aria-hidden />
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Nouvelle gratitude
              </span>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${todayCount >= 3 ? 'bg-white/5 text-[var(--text-muted)]' : 'bg-[#10B981]/10 text-[#10B981]'}`}
              aria-live="polite"
            >
              {todayCount}/3 aujourd&apos;hui
            </span>
          </div>

          {todayCount < 3 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Animated prompt */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={prompt}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-[#D4AF37] font-medium"
                >
                  {prompt}
                </motion.p>
              </AnimatePresence>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Écris librement ce qui monte du cœur…"
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#10B981]/50 focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition"
                aria-label="Contenu de ta gratitude"
                disabled={submitting}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">
                  {content.length}/1000
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  disabled={!canSubmit}
                  icon={<Send className="h-4 w-4" aria-hidden />}
                >
                  Partager
                </Button>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-400 flex items-center gap-1">
                  <span aria-hidden>⚠️</span> {error}
                </p>
              )}
            </form>
          ) : (
            <div className="text-center py-4 space-y-2">
              <p className="text-2xl" aria-hidden>🙏</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Tu as partagé tes 3 gratitudes du jour. À demain pour de nouvelles.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          aria-label="Gratitudes d'aujourd'hui"
        >
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#10B981]">
            Aujourd&apos;hui
          </h2>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {todayEntries.map((entry) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: successId === entry.id ? [1, 0.6, 1] : 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <GratitudeCard entry={entry} highlight={successId === entry.id} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.section>
      )}

      {/* Past entries timeline */}
      {loadingEntries ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : pastEntries.length > 0 ? (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          aria-label="Historique des gratitudes"
        >
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Les 30 derniers jours
          </h2>
          <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.06]">
            {pastGroups.map((group) => (
              <div key={group.label} className="pl-8 space-y-3">
                <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                  <Heart className="h-3 w-3 text-[#10B981]" aria-hidden />
                </div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] capitalize -mt-1">
                  {group.label}
                </p>
                <ul className="space-y-2">
                  {group.items.map((entry) => (
                    <li key={entry.id}>
                      <GratitudeCard entry={entry} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.section>
      ) : !loadingEntries && entries.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-10 w-10 text-[#10B981]/50" />}
          title="Ton journal est vierge"
          description="Écris ta première gratitude et commence à transformer ton regard sur la vie."
        />
      ) : null}
    </div>
  )
}

function GratitudeCard({ entry, highlight = false }: { entry: GratitudeEntry; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border bg-white/[0.03] backdrop-blur-sm px-4 py-3 transition-all duration-300 ${
        highlight ? 'border-[#10B981]/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'border-white/[0.06]'
      }`}
    >
      <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">
        {entry.content}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Clock className="h-3 w-3" aria-hidden />
        <time dateTime={entry.created_at}>{formatTime(entry.created_at)}</time>
      </div>
    </div>
  )
}
