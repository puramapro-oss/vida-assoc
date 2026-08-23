'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Check, PlayCircle } from 'lucide-react'

export function Hero() {
  return (
    <section
      className="relative overflow-x-clip overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32"
      data-testid="hero"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute top-1/3 right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(212,175,55,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(4,18,12,0.4)_60%,var(--bg-void)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text-secondary)]"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]" />
          </span>
          <span className="tracking-wide uppercase">Sangha · Nouveau</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-8 font-[family-name:var(--font-display)] text-[44px] leading-[1.02] sm:text-6xl md:text-7xl font-semibold tracking-[-0.03em] max-w-3xl mx-auto"
        >
          Agir ensemble.{' '}
          <span className="gradient-text">Changer le monde.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.16 }}
          className="mt-6 text-[17px] sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-[1.5]"
        >
          Missions, dons et rituels collectifs — au service de toutes les associations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/signup"
            data-testid="hero-cta-signup"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-[#04120c] px-7 py-3.5 text-[15px] font-semibold shadow-[0_10px_40px_-12px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_60px_-12px_rgba(255,255,255,0.4)] transition-all"
          >
            Commencer
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#missions"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-7 py-3.5 text-[15px] text-[var(--text-primary)] hover:bg-white/10 transition-all"
          >
            <PlayCircle className="h-4 w-4" />
            Voir une mission
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] sm:text-[13px] text-[var(--text-muted)]"
        >
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> Gratuit</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> Sans carte</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> 50 % reversés</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> RGPD</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 mx-auto max-w-xl"
        >
          <div className="relative rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-8 shadow-[0_40px_120px_-20px_rgba(16,185,129,0.25)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#0ea371] flex items-center justify-center text-xl">🌱</div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Mission du jour</div>
                  <div className="text-xs text-[var(--text-muted)]">À 2 min · Frasne</div>
                </div>
              </div>
              <div className="rounded-full bg-[#10B981]/15 text-[#10B981] text-[11px] font-semibold px-3 py-1">+25 pts</div>
            </div>
            <div className="text-left">
              <div className="text-[15px] text-[var(--text-primary)] leading-snug">Ramasser 10 déchets près du lac et photographier le sac.</div>
              <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-[#10B981] to-[#D4AF37]" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[var(--text-muted)]">
                <span>6 / 10 déchets</span>
                <span>64 %</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Stats ───────────────────────────────────────────────────────────────────
// Truth-only: pas de chiffres inventés. On montre la promesse, pas des stats fake.
