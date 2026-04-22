'use client'

import { motion } from 'framer-motion'
import { Award, TrendingUp } from 'lucide-react'

export type AmbassadorTierKey = 'graine' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend' | 'titan' | 'eternal'

export const TIERS: Array<{ key: AmbassadorTierKey; label: string; threshold: number; commissionBase: number; color: string }> = [
  { key: 'graine',   label: 'Graine',   threshold: 0,     commissionBase: 10, color: 'text-slate-400' },
  { key: 'bronze',   label: 'Bronze',   threshold: 10,    commissionBase: 10, color: 'text-amber-600' },
  { key: 'silver',   label: 'Silver',   threshold: 25,    commissionBase: 11, color: 'text-slate-300' },
  { key: 'gold',     label: 'Gold',     threshold: 50,    commissionBase: 12, color: 'text-amber-400' },
  { key: 'platinum', label: 'Platinum', threshold: 100,   commissionBase: 13, color: 'text-indigo-400' },
  { key: 'diamond',  label: 'Diamond',  threshold: 250,   commissionBase: 15, color: 'text-cyan-400' },
  { key: 'legend',   label: 'Légende',  threshold: 500,   commissionBase: 17, color: 'text-fuchsia-400' },
  { key: 'titan',    label: 'Titan',    threshold: 5000,  commissionBase: 20, color: 'text-rose-400' },
  { key: 'eternal',  label: 'Éternel',  threshold: 10000, commissionBase: 25, color: 'text-amber-300' },
]

export function resolveTier(activeReferrals: number): AmbassadorTierKey {
  const sorted = [...TIERS].reverse()
  for (const t of sorted) if (activeReferrals >= t.threshold) return t.key
  return 'graine'
}

interface AmbassadorTierProps {
  activeReferrals: number
}

export function AmbassadorTier({ activeReferrals }: AmbassadorTierProps) {
  const current = TIERS.find((t) => t.key === resolveTier(activeReferrals)) ?? TIERS[0]
  const nextIdx = TIERS.findIndex((t) => t.key === current.key) + 1
  const next = TIERS[nextIdx]
  const progress = next ? Math.min(100, Math.round((activeReferrals / next.threshold) * 100)) : 100

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Award className={`h-5 w-5 ${current.color}`} />
        <h3 className="font-semibold">Palier {current.label}</h3>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {activeReferrals} filleul{activeReferrals > 1 ? 's' : ''} actif{activeReferrals > 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Commission base : <strong className="text-white">+{current.commissionBase}%</strong> sur chaque paiement filleul N1.
      </p>
      {next && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>Vers {next.label}</span>
            <span>{activeReferrals} / {next.threshold}</span>
          </div>
          <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-fuchsia-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-emerald-400 inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +{next.commissionBase - current.commissionBase}% de commission quand tu atteins {next.label}
          </p>
        </div>
      )}
    </motion.div>
  )
}
