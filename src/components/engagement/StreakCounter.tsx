'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

export function StreakCounter({ days }: { days: number }) {
  const multiplier = days >= 100 ? 10 : days >= 60 ? 7 : days >= 30 ? 5 : days >= 14 ? 3 : days >= 7 ? 2 : 1
  return (
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 glass rounded-xl px-3 py-2">
      <Flame className="h-4 w-4 text-orange-400" />
      <span className="font-semibold">{days}j</span>
      <span className="text-xs text-[var(--text-muted)]">×{multiplier}</span>
    </motion.div>
  )
}
