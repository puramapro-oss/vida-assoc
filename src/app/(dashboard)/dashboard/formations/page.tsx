'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Sparkles, Search, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Formation } from '@/types'

const TYPE_EMOJI: Record<Formation['type'], string> = {
  video: '🎬',
  livre: '📖',
  papier: '📄',
  audio: '🎧',
  interactive: '🧠',
}

const AUDIENCE_LABEL: Record<Formation['target_audience'], string> = {
  adulte: 'Adulte',
  enfant: 'Enfant',
  handicap_visuel: 'Audio-visuel',
  handicap_auditif: 'Sous-titres',
  handicap_moteur: 'Accessible',
  senior: 'Senior',
  tous: 'Tous publics',
}

export default function FormationsPage() {
  const { profile } = useAuth()
  const [formations, setFormations] = useState<Formation[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [audience, setAudience] = useState<Formation['target_audience'] | 'all'>('all')

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const { data } = await sb.from('formations').select('*').order('created_at', { ascending: false }).limit(60)
      setFormations((data as Formation[] | null) ?? [])
      if (profile) {
        const { data: prog } = await sb
          .from('formation_progress')
          .select('formation_id, percent_complete')
          .eq('user_id', profile.id)
        const map: Record<string, number> = {}
        ;((prog as { formation_id: string; percent_complete: number }[] | null) ?? []).forEach((p) => {
          map[p.formation_id] = p.percent_complete
        })
        setProgress(map)
      }
      setLoading(false)
    })()
  }, [profile])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return formations.filter((f) => {
      if (audience !== 'all' && f.target_audience !== audience && f.target_audience !== 'tous') return false
      if (!q) return true
      return `${f.title} ${f.description ?? ''}`.toLowerCase().includes(q)
    })
  }, [formations, search, audience])

  if (loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Chargement des formations…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="formations-page">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cyan)]/10 text-[var(--cyan)]">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Formations</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Apprends, pratique, transmets — vidéos, audios et lectures guidées.
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher une formation…"
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm focus:border-[var(--cyan)] focus:outline-none"
            data-testid="formations-search"
          />
        </div>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as Formation['target_audience'] | 'all')}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--cyan)] focus:outline-none"
          aria-label="Filtrer par public"
        >
          <option value="all">Tous publics</option>
          <option value="adulte">Adulte</option>
          <option value="enfant">Enfant</option>
          <option value="senior">Senior</option>
          <option value="handicap_visuel">Accessible visuel</option>
          <option value="handicap_auditif">Accessible auditif</option>
          <option value="handicap_moteur">Accessible moteur</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📚" title="Rien pour cette recherche" description="Essaie un autre mot-clé." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f, i) => {
            const pct = progress[f.id] ?? 0
            const locked = !!f.required_plan && f.required_plan !== 'free' && (profile?.plan ?? 'free') === 'free' && !f.is_free
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:border-[var(--cyan)]/40 transition"
                data-testid="formation-card"
              >
                <div className="relative aspect-video bg-gradient-to-br from-[var(--cyan)]/20 to-[var(--purple)]/10">
                  {f.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">{TYPE_EMOJI[f.type]}</div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-white">
                    {TYPE_EMOJI[f.type]} {f.type}
                  </span>
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)] line-clamp-1">
                    {f.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{f.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    {f.duration_minutes && (
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {f.duration_minutes} min</span>
                    )}
                    <span className="rounded-full bg-white/5 px-2 py-0.5">{AUDIENCE_LABEL[f.target_audience]}</span>
                    {f.is_free ? (
                      <span className="text-[var(--green)]">Gratuit</span>
                    ) : (
                      <span className="text-[#D4AF37]">{formatPrice(f.price_cents)}</span>
                    )}
                  </div>
                  {pct > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full bg-[var(--green)]" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{pct}% lu</p>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/formations/${f.slug}`}
                    className="mt-4 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition"
                  >
                    <Sparkles className="h-3 w-3" /> {pct > 0 ? 'Reprendre' : 'Commencer'}
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
