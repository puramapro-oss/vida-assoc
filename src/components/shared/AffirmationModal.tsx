'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Affirmation {
  id: string
  category: string
  text_fr: string
  text_en: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  love: '💚',
  power: '⚡',
  abundance: '🌾',
  health: '🌿',
  wisdom: '🧘',
  gratitude: '🙏',
}

export default function AffirmationModal() {
  const { user } = useAuth()
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null)
  const [visible, setVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const storageKey = 'vida-affirmation-last'
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem(storageKey)

    if (lastShown === today) return

    supabase
      .from('affirmations')
      .select('*')
      .eq('active', true)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const random = data[Math.floor(Math.random() * data.length)] as Affirmation
        setAffirmation(random)
        setVisible(true)
        localStorage.setItem(storageKey, today)
      })
  }, [user, supabase])

  const close = useCallback(() => setVisible(false), [])

  if (!visible || !affirmation) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={close}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md glass rounded-3xl p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981]/10">
            <Sparkles className="h-7 w-7 text-[#10B981]" />
          </div>

          <p className="text-xs font-medium text-[#D4AF37] uppercase tracking-wider mb-3">
            {CATEGORY_EMOJI[affirmation.category] || '✨'} Affirmation du jour
          </p>

          <p className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] leading-relaxed">
            {affirmation.text_fr}
          </p>

          <p className="mt-3 text-sm text-[var(--text-muted)] italic">
            {affirmation.text_en}
          </p>

          <button
            onClick={close}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-6 py-3 font-semibold text-[#04120c] hover:opacity-90 transition-opacity"
          >
            <Heart className="h-4 w-4" /> Merci, VIDA
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
