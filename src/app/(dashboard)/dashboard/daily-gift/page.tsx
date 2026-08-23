'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Confetti from '@/components/shared/Confetti'
import type { DailyGift, ChestState } from './types'
import { useCountdown } from './hooks'
import {
  ChestClosed,
  ChestOpening,
  ChestRevealed,
  GiftLegend,
} from './components'

export default function DailyGiftPage() {
  const { user } = useAuth()
  const [chestState, setChestState] = useState<ChestState>('closed')
  const [gift, setGift] = useState<DailyGift | null>(null)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const countdown = useCountdown(0) // reset at midnight

  // ── Load status on mount ────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/daily-gift')
      if (!res.ok) throw new Error()
      const data = await res.json() as { opened: boolean; gift: DailyGift | null; streak: number }
      setStreak(data.streak)
      if (data.opened && data.gift) {
        setGift(data.gift)
        setChestState('revealed')
      } else {
        setChestState('closed')
      }
    } catch {
      setError('Impossible de charger le coffre. Réessaie dans quelques secondes.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    queueMicrotask(() => loadStatus())
  }, [loadStatus])

  // ── Open chest ──────────────────────────────────────────────────────────────
  const openChest = async () => {
    if (chestState !== 'closed' || opening) return
    setOpening(true)
    setError(null)
    setChestState('opening')

    try {
      const res = await fetch('/api/daily-gift', { method: 'POST' })
      const data = await res.json() as { gift?: DailyGift; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        setChestState('closed')
        return
      }
      // Wait for animation to finish
      await new Promise((r) => setTimeout(r, 1_500))
      setGift(data.gift!)
      setStreak((s) => s + 1)
      setChestState('revealed')
      setShowConfetti(true)
    } catch {
      setError('Erreur réseau. Vérifie ta connexion et réessaie.')
      setChestState('closed')
    } finally {
      setOpening(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <Confetti active={showConfetti} duration={4000} />

      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center gap-8 px-4 py-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Coffre quotidien</h1>
          <p className="mt-1 text-sm text-white/50">Un cadeau chaque jour pour toi</p>
        </div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2"
        >
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-300">
            {streak} jour{streak !== 1 ? 's' : ''} de suite
          </span>
          {streak >= 7 && (
            <span className="ml-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
              🔥 Bonus streak actif
            </span>
          )}
        </motion.div>

        {/* Glass card — chest area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative w-full overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.04] p-8 backdrop-blur-xl"
        >
          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-[#10B981]/5 via-transparent to-[#D4AF37]/5" />

          <AnimatePresence mode="wait">
            {chestState === 'closed' && (
              <ChestClosed onOpen={openChest} opening={opening} error={error} />
            )}

            {chestState === 'opening' && <ChestOpening />}

            {chestState === 'revealed' && gift && (
              <ChestRevealed gift={gift} countdown={countdown} />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Gift type legend */}
        <GiftLegend />
      </div>
    </>
  )
}
