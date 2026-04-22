'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, ArrowRight } from 'lucide-react'

interface FiscalBannerProps {
  profile?: 'particulier_occ' | 'bnc' | 'autoentrepreneur' | 'entreprise' | null
  cumulCents?: number
}

export function FiscalBanner({ profile, cumulCents = 0 }: FiscalBannerProps) {
  const cumul = (cumulCents / 100).toFixed(2)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-cyan-500/20"
    >
      <div className="flex items-start gap-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">Fiscalité — tu gagnes, on déclare</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Zéro paperasse. Sangha s&apos;occupe de l&apos;URSSAF pour toi.
            {profile && cumulCents > 0 ? ` Tu as cumulé ${cumul}€ cette année.` : ' Active ton espace fiscal en 1 min.'}
          </p>
          <Link
            href="/dashboard/fiscal"
            className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
          >
            Accéder à mon espace fiscal <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
