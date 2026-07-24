'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Lock, Unlock } from 'lucide-react'

interface PrimeTrackerProps {
  totalAllocatedCents: number
  totalUnlockedCents: number
  nextUnlockAt?: string | null
  phase: 'phase1' | 'phase2'
}

export function PrimeTracker({ totalAllocatedCents, totalUnlockedCents, nextUnlockAt, phase }: PrimeTrackerProps) {
  const allocated = (totalAllocatedCents / 100).toFixed(2)
  const unlocked = (totalUnlockedCents / 100).toFixed(2)
  const pending = ((totalAllocatedCents - totalUnlockedCents) / 100).toFixed(2)

  const [now] = useState(() => Date.now())
  const daysLeft = useMemo(() =>
    nextUnlockAt
      ? Math.max(0, Math.ceil((new Date(nextUnlockAt).getTime() - now) / (1000 * 60 * 60 * 24)))
      : null,
    [nextUnlockAt, now]
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Tes primes Sangha</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Mode {phase === 'phase2' ? 'Phase 2 — Purama Card active' : 'Phase 1 — wallet bienvenue'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Total alloué</p>
          <p className="text-xl font-bold">{allocated}€</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
            <Unlock className="h-3 w-3" /> Débloqué
          </p>
          <p className="text-xl font-bold text-emerald-400">{unlocked}€</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> En attente
          </p>
          <p className="text-xl font-bold text-amber-400">{pending}€</p>
        </div>
      </div>
      {daysLeft !== null && daysLeft > 0 && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Prochain déblocage dans <strong className="text-emerald-400">{daysLeft} jours</strong>.
        </p>
      )}
    </motion.div>
  )
}
