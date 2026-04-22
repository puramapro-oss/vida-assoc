'use client'

import { motion } from 'framer-motion'
import { CreditCard, Sparkles } from 'lucide-react'

interface CardTeaserProps {
  tier?: 'silver' | 'gold' | 'platinum' | 'eternal'
}

const TIER_COLORS: Record<string, { from: string; to: string; label: string }> = {
  silver:   { from: 'from-slate-400',  to: 'to-slate-600',  label: 'Silver' },
  gold:     { from: 'from-amber-400',  to: 'to-yellow-600', label: 'Gold' },
  platinum: { from: 'from-indigo-400', to: 'to-purple-600', label: 'Platinum' },
  eternal:  { from: 'from-rose-400',   to: 'to-fuchsia-600', label: 'Éternelle' },
}

export function CardTeaser({ tier = 'silver' }: CardTeaserProps) {
  const colors = TIER_COLORS[tier]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden glass rounded-2xl p-5"
    >
      <div className={`absolute -top-8 -right-8 h-40 w-40 rounded-full bg-gradient-to-br ${colors.from} ${colors.to} opacity-20 blur-2xl`} />
      <div className="relative flex items-start gap-4">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors.from} ${colors.to} text-white shrink-0`}>
          <CreditCard className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Ta Purama Card {colors.label} arrive</h3>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Paie avec la carte qui redistribue à chaque achat. Smart Split entre toi, l&apos;asso de ton cœur, et Sangha.
          </p>
          <ul className="mt-3 text-xs text-[var(--text-muted)] space-y-0.5">
            <li>• Débit instantané sur ton wallet</li>
            <li>• Cashback Points sur chaque achat</li>
            <li>• Conforme DSP2 (STEL)</li>
            <li>• Disponible en Phase 2</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
