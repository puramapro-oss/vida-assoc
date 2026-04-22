'use client'

import { motion } from 'framer-motion'
import { Wallet, CreditCard, Clock } from 'lucide-react'
import { daysUntilWithdrawal } from '@/lib/phase'

interface WalletPhase1Props {
  balanceCents: number
  signupAt?: string | null
}

export function WalletPhase1({ balanceCents, signupAt }: WalletPhase1Props) {
  const balance = (balanceCents / 100).toFixed(2)
  const daysLeft = daysUntilWithdrawal(signupAt)
  const withdrawalReady = daysLeft === 0 && balanceCents >= 500

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Ton wallet Sangha</h3>
          <p className="text-xs text-[var(--text-muted)]">Phase 1 — retrait IBAN dès 5€</p>
        </div>
      </div>
      <div className="text-3xl font-bold font-[family-name:var(--font-display)]">{balance}€</div>

      {!withdrawalReady && daysLeft > 0 && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-400">
          <Clock className="h-3 w-3" />
          Retrait débloqué dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
        </div>
      )}
      {!withdrawalReady && daysLeft === 0 && balanceCents < 500 && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <CreditCard className="h-3 w-3" />
          Minimum retrait : 5€
        </div>
      )}
      {withdrawalReady && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400">
          <CreditCard className="h-3 w-3" />
          Retrait IBAN disponible
        </div>
      )}
    </motion.div>
  )
}
