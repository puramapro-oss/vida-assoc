'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WISDOM_QUOTES } from '@/lib/awakening'

/**
 * SpiritualLayer — rotation douce de citations sagesse en pied de page.
 * V7.2 §15 : citations sagesse, micro-textes empowering, géométrie sacrée.
 * Respect prefers-reduced-motion.
 */
export function SpiritualLayer() {
  const [idx, setIdx] = useState(0)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const interval = setInterval(() => setIdx((i) => (i + 1) % WISDOM_QUOTES.length), 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sangha-spiritual-layer')
      if (stored === 'off') queueMicrotask(() => setEnabled(false))
    } catch { /* storage may fail in private mode */ }
  }, [])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed bottom-4 inset-x-0 z-10 flex justify-center px-4" aria-hidden>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.4, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.8 }}
          className="text-xs italic text-[var(--text-muted)] text-center max-w-lg hidden md:block"
        >
          {WISDOM_QUOTES[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
