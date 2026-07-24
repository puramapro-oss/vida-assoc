'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CardTeaser } from '@/components/wallet/CardTeaser'
import { SmartSplit } from '@/components/wallet/SmartSplit'
import { getPhase, isCardAvailable } from '@/lib/phase'
import { CreditCard, Lock } from 'lucide-react'

interface CardState {
  tier: 'silver' | 'gold' | 'platinum' | 'eternal'
  status: 'teaser' | 'requested' | 'shipped' | 'active' | 'paused' | 'revoked'
  card_last4?: string | null
}

export default function CardPage() {
  const [phase, setPhase] = useState<'phase1' | 'phase2'>('phase1')
  const [card, setCard] = useState<CardState | null>(null)
  const [split, setSplit] = useState({ user: 70, asso: 10, sasu: 20 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queueMicrotask(() => {
      setPhase(getPhase())
      // Placeholder: fetch card status
      setCard({ tier: 'silver', status: 'teaser' })
      setLoading(false)
    })
  }, [])

  async function saveSplit(s: { user: number; asso: number; sasu: number }) {
    setSplit(s)
    // Placeholder: POST to /api/card/split
  }

  if (loading) return <div className="p-6 text-[var(--text-muted)]">Chargement…</div>

  const active = isCardAvailable() && card?.status === 'active'

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-3xl">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CreditCard className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Purama Card</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Mode <strong className="text-white">{phase === 'phase2' ? 'Phase 2 — carte active' : 'Phase 1 — teaser'}</strong>
        </p>
      </motion.section>

      <CardTeaser tier={card?.tier ?? 'silver'} />

      {!active ? (
        <section className="glass rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-[var(--text-muted)] shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold">Activation en Phase 2</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                La Purama Card sera activée dès que les premiers CPA partenaires seront signés. En attendant, profite de ta prime de bienvenue wallet (Phase 1).
              </p>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Bascule automatique sans downtime via <code>PRIME_MODE=phase2</code>.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <SmartSplit
        userSharePercent={split.user}
        assoSharePercent={split.asso}
        sasuSharePercent={split.sasu}
        onSave={saveSplit}
        readOnly={!active}
      />
    </div>
  )
}
