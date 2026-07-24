'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { getEmpowermentMessage, type EmpowermentContext } from '@/lib/awakening'

/**
 * SubconsciousEngine — injection de micro-textes empowering aux moments clés.
 * Le parent déclenche via prop `trigger` (changement de clé → nouveau message).
 * V7.2 §15.
 */
interface SubconsciousEngineProps {
  trigger: EmpowermentContext | null
  onDismiss?: () => void
}

export function SubconsciousEngine({ trigger, onDismiss }: SubconsciousEngineProps) {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!trigger) return
    queueMicrotask(() => setMessage(getEmpowermentMessage(trigger)))
    const timeout = setTimeout(() => {
      queueMicrotask(() => setMessage(null))
      onDismiss?.()
    }, 4500)
    return () => clearTimeout(timeout)
  }, [trigger, onDismiss])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.35 }}
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-sm"
          role="status"
          aria-live="polite"
        >
          <div className="glass rounded-2xl px-5 py-3 border border-emerald-500/30 inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <p className="text-sm italic text-emerald-100">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
