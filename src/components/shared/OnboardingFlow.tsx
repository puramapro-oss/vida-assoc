'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Globe, Heart, Sparkles, ArrowRight, X, Trophy, BookOpen, Wallet,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { APP_SHORT_NAME } from '@/lib/constants'

const STORAGE_INTRO = 'vida_assoc_intro_seen'
const STORAGE_TUTO = 'vida_assoc_tutorial_completed'

interface TutoStep {
  id: string
  emoji: string
  title: string
  body: string
  cta: string
  Icon: typeof Globe
}

const STEPS: TutoStep[] = [
  {
    id: 'welcome',
    emoji: '🌱',
    title: `Bienvenue dans ${APP_SHORT_NAME}`,
    body: 'Ici, chaque action compte. Tu vas découvrir un espace pour transformer tes intentions en impact réel.',
    cta: 'Commencer',
    Icon: Sparkles,
  },
  {
    id: 'missions',
    emoji: '🎯',
    title: 'Réalise des missions',
    body: 'Ramasser des déchets, donner du sang, planter un arbre… Chaque mission validée gonfle ton impact et ton wallet.',
    cta: 'Suivant',
    Icon: Globe,
  },
  {
    id: 'dons',
    emoji: '❤️',
    title: 'Soutiens des associations',
    body: '100 % de ton don part à l’association choisie. Sangha ne prélève aucune commission sur les dons aux autres.',
    cta: 'Suivant',
    Icon: Heart,
  },
  {
    id: 'rituels',
    emoji: '🕊️',
    title: 'Rejoins les rituels collectifs',
    body: 'Méditations guidées, intentions de paix, actions de purification. Tu n’es jamais seul·e.',
    cta: 'Suivant',
    Icon: Sparkles,
  },
  {
    id: 'concours',
    emoji: '🏆',
    title: 'Joue aux concours',
    body: '10 gagnants chaque semaine. Tu gagnes des tickets en agissant — pas en payant.',
    cta: 'Suivant',
    Icon: Trophy,
  },
  {
    id: 'wallet',
    emoji: '💰',
    title: 'Encaisse tes gains',
    body: 'Dès 5 €, tu peux retirer tes gains sur ton IBAN. Récompenses missions, parrainage, concours — tout te revient.',
    cta: 'Suivant',
    Icon: Wallet,
  },
  {
    id: 'parcours',
    emoji: '✨',
    title: 'Apprends, partage, élève',
    body: 'Formations, communauté, parrainage… Tu vas grandir avec une famille engagée.',
    cta: 'C’est parti',
    Icon: BookOpen,
  },
]

export default function OnboardingFlow() {
  const { user, profile, refetch } = useAuth()
  const [phase, setPhase] = useState<'idle' | 'cinematic' | 'tutorial' | 'done'>('idle')
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    if (!user || !profile) return
    if (typeof window === 'undefined') return

    const introSeen = localStorage.getItem(STORAGE_INTRO) === '1' || profile.onboarded
    const tutoDone = localStorage.getItem(STORAGE_TUTO) === '1' || profile.tutorial_completed

    if (!introSeen) {
      setPhase('cinematic')
    } else if (!tutoDone) {
      setPhase('tutorial')
    } else {
      setPhase('done')
    }
  }, [user, profile])

  const current = useMemo(() => STEPS[stepIdx], [stepIdx])

  async function finishCinematic() {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_INTRO, '1')
    if (user) {
      const sb = createClient()
      await sb.from('profiles').update({ onboarded: true }).eq('id', user.id)
      refetch()
    }
    setPhase('tutorial')
  }

  async function finishTutorial() {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_TUTO, '1')
    if (user) {
      const sb = createClient()
      await sb.from('profiles').update({ tutorial_completed: true }).eq('id', user.id)
      refetch()
    }
    setPhase('done')
  }

  function next() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1)
    else finishTutorial()
  }

  if (phase === 'idle' || phase === 'done') return null

  return (
    <AnimatePresence>
      {phase === 'cinematic' && <Cinematic key="cine" onFinish={finishCinematic} />}
      {phase === 'tutorial' && current && (
        <motion.div
          key="tuto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
          data-testid="tutorial-overlay"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--cyan)]/10 via-white/5 to-[var(--purple)]/10 p-6 md:p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={finishTutorial}
              aria-label="Passer le tutoriel"
              data-testid="tutorial-skip"
              className="absolute right-3 top-3 rounded-full bg-white/5 p-1.5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                {current.emoji}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Étape {stepIdx + 1} / {STEPS.length}</p>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                  {current.title}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">{current.body}</p>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition ${i === stepIdx ? 'bg-[var(--cyan)]' : i < stepIdx ? 'bg-white/30' : 'bg-white/10'}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-5 py-2.5 text-sm font-medium text-white shadow-lg hover:opacity-90 transition"
                data-testid="tutorial-next"
              >
                {current.cta} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Cinematic({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFinish, 4000)
    return () => clearTimeout(t)
  }, [onFinish])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0A0A0F]"
      data-testid="onboarding-cinematic"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.18),transparent_60%)]" />

      <button
        type="button"
        onClick={onFinish}
        className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-white/10 transition"
        data-testid="cinematic-skip"
      >
        Passer
      </button>

      <div className="text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="text-7xl"
        >
          🌱
        </motion.div>
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-4 font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold gradient-text"
        >
          Bienvenue dans {APP_SHORT_NAME}
        </motion.h1>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="mt-3 max-w-md text-sm text-[var(--text-secondary)] mx-auto"
        >
          Tu fais désormais partie d’une famille engagée. Chaque geste, chaque don, chaque intention nourrit l’élan collectif.
        </motion.p>
      </div>
    </motion.div>
  )
}
