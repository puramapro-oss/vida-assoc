'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Search, Globe, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatPrice, formatNumber } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Association } from '@/types'

export default function AssociationsHubPage() {
  const [associations, setAssociations] = useState<Association[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.from('associations')
      .select('*')
      .eq('verified', true)
      .order('featured', { ascending: false })
      .order('impact_score', { ascending: false })
      .limit(80)
      .then(({ data }) => {
        setAssociations((data as Association[] | null) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return associations
    return associations.filter((a) => `${a.name} ${a.description ?? ''} ${a.category ?? ''}`.toLowerCase().includes(q))
  }, [associations, search])

  if (loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Chargement des associations…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10" data-testid="assos-hub">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
          Toutes les <span className="text-[#10B981]">associations</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Vérifiées une à une. Choisis celle qui résonne avec toi.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, cause, pays…"
          data-testid="assos-search"
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#10B981] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🌍" title="Aucune association trouvée" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Link
                href={`/dashboard/associations/${a.slug}`}
                data-testid="asso-link"
                className="group block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#10B981]/40 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] group-hover:text-[#10B981]">
                    {a.name}
                  </h3>
                  {a.verified && <BadgeCheck className="h-4 w-4 text-[#10B981]" />}
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-[var(--text-secondary)]">{a.description}</p>
                <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {a.country ?? 'Monde'}
                  </span>
                  <span>{formatNumber(a.missions_count)} missions</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
                  <span className="text-[#D4AF37] font-semibold">{formatPrice(a.donations_received_cents)}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#10B981] group-hover:gap-2 transition-all">
                    Découvrir <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
