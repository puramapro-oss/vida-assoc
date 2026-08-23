'use client'

import { motion } from 'framer-motion'
import { Clock, Flame } from 'lucide-react'
import type { DailyGift } from './types'
import { GIFT_META } from './constants'

// ── Separator ─────────────────────────────────────────────────────────────────
export function Separator() {
  return <div className="w-full border-t border-white/[0.06]" />
}

// ── Already Opened Notice ─────────────────────────────────────────────────────
export function AlreadyOpenedNotice({ countdown }: { countdown: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-2 text-white/40">
        <Clock className="h-4 w-4" />
        <span className="text-sm">Prochain coffre dans</span>
      </div>
      <span className="font-mono text-2xl font-bold text-[#10B981]">{countdown}</span>
      <p className="text-xs text-white/30">Reviens demain à minuit</p>
    </div>
  )
}

// ── Gift Legend ───────────────────────────────────────────────────────────────
const LEGEND_ITEMS: Array<{ emoji: string; label: string; chance: string }> = [
  { emoji: '⭐', label: 'Crédits (5–20)', chance: '40 %' },
  { emoji: '🏷️', label: 'Coupon -5 %/-10 %', chance: '25 %' },
  { emoji: '🎫', label: 'Ticket concours', chance: '15 %' },
  { emoji: '⚡', label: '+3 crédits', chance: '10 %' },
  { emoji: '💥', label: 'Coupon -20 %', chance: '5 %' },
  { emoji: '🌟', label: 'Méga crédits (50–100)', chance: '3 %' },
  { emoji: '🎁', label: 'Coupon FLASH -50 %', chance: '2 %' },
]

export function GiftLegend() {
  return (
    <div className="w-full rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
        Probabilités
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1">
            <span className="flex items-center gap-2 text-xs text-white/60">
              <span>{item.emoji}</span>
              {item.label}
            </span>
            <span className="shrink-0 text-xs font-semibold text-white/40">{item.chance}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chest Closed ──────────────────────────────────────────────────────────────
interface ChestClosedProps {
  onOpen: () => void
  opening: boolean
  error: string | null
}

export function ChestClosed({ onOpen, opening, error }: ChestClosedProps) {
  return (
    <motion.div
      key="closed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <motion.button
        onClick={onOpen}
        disabled={opening}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative cursor-pointer rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-[#10B981]/10 p-8 transition-all duration-300 hover:border-[#D4AF37]/60 hover:shadow-[0_0_40px_rgba(212,175,55,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Ouvrir le coffre quotidien"
      >
        {/* Animated shimmer */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl select-none"
        >
          🎁
        </motion.div>
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl border border-[#D4AF37]/40"
        />
      </motion.button>

      <div className="text-center">
        <p className="text-base font-semibold text-white">Appuie pour ouvrir</p>
        <p className="mt-1 text-xs text-white/40">Cadeau mystère du jour</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </motion.div>
  )
}

// ── Chest Opening ─────────────────────────────────────────────────────────────
export function ChestOpening() {
  return (
    <motion.div
      key="opening"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <motion.div
        animate={{
          scale: [1, 1.4, 0.9, 1.2, 1],
          rotate: [0, -10, 10, -5, 0],
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        className="text-6xl"
      >
        📦
      </motion.div>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="text-sm text-[#10B981]"
      >
        Ouverture en cours…
      </motion.div>
    </motion.div>
  )
}

// ── Chest Revealed ────────────────────────────────────────────────────────────
interface ChestRevealedProps {
  gift: DailyGift
  countdown: string
}

export function ChestRevealed({ gift, countdown }: ChestRevealedProps) {
  const meta = GIFT_META[gift.gift_type]

  return (
    <motion.div
      key="revealed"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Gift icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${meta.bg} border`}
        style={{ borderColor: `${meta.color}33`, color: meta.color }}
      >
        <span className="text-5xl">{meta.emoji}</span>
      </motion.div>

      {/* Gift name */}
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-white"
        >
          {gift.gift_label}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-sm font-semibold"
          style={{ color: meta.color }}
        >
          {gift.gift_value}
        </motion.p>
      </div>

      {/* Bonus details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {gift.points_earned > 0 && (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            +{gift.points_earned} crédits Sangha
          </span>
        )}
        {gift.credits_earned > 0 && (
          <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
            +{gift.credits_earned} crédits bonus
          </span>
        )}
        {gift.tickets_earned > 0 && (
          <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300">
            +{gift.tickets_earned} ticket{gift.tickets_earned > 1 ? 's' : ''}
          </span>
        )}
        {gift.coupon_discount && (
          <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300">
            -{gift.coupon_discount}% valable {gift.coupon_days}j
          </span>
        )}
      </motion.div>

      {/* Streak badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5"
      >
        <Flame className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-xs text-orange-300">
          Série de {gift.streak_count} jour{gift.streak_count !== 1 ? 's' : ''}
          {gift.streak_count >= 7 && ' 🔥'}
        </span>
      </motion.div>

      <Separator />

      {/* "Déjà ouvert" section — countdown */}
      <AlreadyOpenedNotice countdown={countdown} />
    </motion.div>
  )
}
