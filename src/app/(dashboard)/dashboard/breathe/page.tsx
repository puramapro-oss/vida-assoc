'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Wind, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import type { Technique, TechniqueConfig, Phase, AppState } from './types'
import { TECHNIQUES, DEFAULT_CYCLES, PHASE_LABELS } from './constants'

export default function BreathePage() {
  const { user } = useAuth()

  const [technique, setTechnique] = useState<Technique>('4-7-8')
  const [appState, setAppState] = useState<AppState>('ready')
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale')
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0)
  const [cyclesDone, setCyclesDone] = useState(0)
  const [totalCycles] = useState(DEFAULT_CYCLES)
  const [saving, setSaving] = useState(false)
  const [xpGained, setXpGained] = useState(0)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseRef = useRef<Phase>('inhale')
  const cyclesRef = useRef(0)
  const startTimeRef = useRef<number>(0)

  const config = TECHNIQUES[technique]

  // ─── Timer engine ────────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const getNextPhase = useCallback(
    (phase: Phase): Phase => {
      if (phase === 'inhale') return 'hold'
      if (phase === 'hold') return 'exhale'
      if (phase === 'exhale') {
        return config.holdAfterExhale > 0 ? 'holdAfterExhale' : 'inhale'
      }
      return 'inhale'
    },
    [config]
  )

  const getPhaseDuration = useCallback(
    (phase: Phase): number => {
      if (phase === 'inhale') return config.inhale
      if (phase === 'hold') return config.hold
      if (phase === 'exhale') return config.exhale
      return config.holdAfterExhale
    },
    [config]
  )

  const runPhase = useCallback(
    (phase: Phase, remaining: number) => {
      phaseRef.current = phase
      setCurrentPhase(phase)
      setPhaseTimeLeft(remaining)

      if (remaining <= 0) {
        // Phase done — advance
        const next = getNextPhase(phase)
        const isEndOfCycle =
          phase === 'exhale' && config.holdAfterExhale === 0
          || phase === 'holdAfterExhale'

        if (isEndOfCycle) {
          const newCount = cyclesRef.current + 1
          cyclesRef.current = newCount
          setCyclesDone(newCount)

          if (newCount >= totalCycles) {
            setAppState('done')
            return
          }
        }

        const nextDuration = getPhaseDuration(next)
        // eslint-disable-next-line react-hooks/immutability
        timerRef.current = setTimeout(() => runPhase(next, nextDuration), 0)
        return
      }

      timerRef.current = setTimeout(() => runPhase(phase, remaining - 1), 1000)
    },
    [getNextPhase, getPhaseDuration, config, totalCycles]
  )

  // ─── Session save ─────────────────────────────────────────────────────────

  const saveSession = useCallback(async () => {
    if (!user) return
    setSaving(true)

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await fetch('/api/breathe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technique,
          duration_seconds: duration,
          cycles: totalCycles,
        }),
      })

      if (res.ok) {
        setXpGained(10)

        // Haptic feedback if multisensorial enabled
        try {
          const multisensorial = localStorage.getItem('vida-multisensorial')
          if (multisensorial === 'true' && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200])
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore — save is best-effort */ }

    setSaving(false)
  }, [user, technique, totalCycles])

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (appState === 'done') {
      clearTimer()
      queueMicrotask(() => saveSession())
    }
  }, [appState, clearTimer, saveSession])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    clearTimer()
    cyclesRef.current = 0
    setCyclesDone(0)
    setAppState('breathing')
    startTimeRef.current = Date.now()
    runPhase('inhale', config.inhale)
  }, [clearTimer, runPhase, config])

  const handleReset = useCallback(() => {
    clearTimer()
    cyclesRef.current = 0
    setCyclesDone(0)
    setAppState('ready')
    setCurrentPhase('inhale')
    setPhaseTimeLeft(0)
    setXpGained(0)
  }, [clearTimer])

  const handleTechniqueChange = useCallback(
    (t: Technique) => {
      if (appState === 'breathing') return
      setTechnique(t)
      handleReset()
    },
    [appState, handleReset]
  )

  // ─── Visual helpers ───────────────────────────────────────────────────────

  const circleScale = (() => {
    if (appState !== 'breathing') return 1
    if (currentPhase === 'inhale') {
      const progress = 1 - phaseTimeLeft / config.inhale
      return 1 + progress * 0.5
    }
    if (currentPhase === 'hold') return 1.5
    if (currentPhase === 'exhale') {
      const progress = 1 - phaseTimeLeft / config.exhale
      return 1.5 - progress * 0.5
    }
    return 1
  })()

  const circleOpacity = (() => {
    if (appState !== 'breathing') return 0.4
    if (currentPhase === 'hold' || currentPhase === 'holdAfterExhale') return 0.85
    return 0.55 + (circleScale - 1) * 0.6
  })()

  const progressPercent = (cyclesDone / totalCycles) * 100

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      {/* Page title */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <Wind className="w-5 h-5 text-[#10B981]" />
          <h1 className="text-2xl font-semibold text-white">Respiration guidée</h1>
        </div>
        <p className="text-sm text-white/50 max-w-xs mx-auto">
          Régule ton système nerveux et recentre-toi en quelques minutes.
        </p>
      </div>

      {/* Technique selector */}
      <div className="flex gap-2 mb-10">
        {(Object.values(TECHNIQUES) as TechniqueConfig[]).map((t) => (
          <button
            key={t.id}
            onClick={() => handleTechniqueChange(t.id)}
            disabled={appState === 'breathing'}
            className={[
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
              technique === t.id
                ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80',
              appState === 'breathing' ? 'opacity-40 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center mb-10" style={{ width: 280, height: 280 }}>
        {/* Outer glow ring */}
        <div
          className="absolute rounded-full transition-all"
          style={{
            width: 280,
            height: 280,
            background:
              'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
            transform: `scale(${circleScale})`,
            transition: 'transform 1s ease-in-out',
          }}
        />

        {/* Main circle */}
        <div
          className="rounded-full border border-[#10B981]/30 flex items-center justify-center"
          style={{
            width: 200,
            height: 200,
            background: `radial-gradient(circle at 40% 35%, rgba(16,185,129,${circleOpacity * 0.6}), rgba(212,175,55,${circleOpacity * 0.25}) 60%, transparent)`,
            boxShadow: `0 0 ${40 + (circleScale - 1) * 60}px rgba(16,185,129,${circleOpacity * 0.35})`,
            transform: `scale(${circleScale})`,
            transition: 'transform 1s ease-in-out, box-shadow 1s ease-in-out',
          }}
        >
          {appState === 'breathing' && (
            <div className="text-center select-none">
              <p className="text-[#10B981] text-lg font-semibold tracking-wide">
                {PHASE_LABELS[currentPhase]}
              </p>
              <p className="text-white/90 text-4xl font-bold tabular-nums mt-1">
                {phaseTimeLeft}
              </p>
            </div>
          )}

          {appState === 'ready' && (
            <Wind className="w-10 h-10 text-[#10B981]/60" />
          )}

          {appState === 'done' && (
            <CheckCircle2 className="w-12 h-12 text-[#10B981]" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      {appState !== 'ready' && (
        <div className="w-full max-w-xs mb-6">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>{cyclesDone} / {totalCycles} cycles</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#D4AF37] transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Technique description */}
      {appState === 'ready' && (
        <p className="text-white/40 text-sm text-center max-w-xs mb-8">
          {config.description}
        </p>
      )}

      {/* CTA */}
      <div className="flex flex-col items-center gap-3">
        {appState === 'ready' && (
          <Button size="lg" onClick={handleStart}>
            Commencer — {totalCycles} cycles
          </Button>
        )}

        {appState === 'breathing' && (
          <Button variant="secondary" size="md" onClick={handleReset}>
            Arrêter
          </Button>
        )}

        {appState === 'done' && (
          <>
            {/* Celebration */}
            <div className="glass-card text-center px-8 py-6 mb-2 max-w-xs">
              <p className="text-[#10B981] text-xl font-semibold mb-1">
                Séance terminée ✨
              </p>
              <p className="text-white/60 text-sm mb-3">
                {totalCycles} cycles · {config.totalPerCycle * totalCycles}s · technique {config.label}
              </p>
              {saving ? (
                <p className="text-white/40 text-xs">Enregistrement…</p>
              ) : xpGained > 0 ? (
                <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm px-3 py-1 rounded-full">
                  +{xpGained} XP conscience
                </div>
              ) : null}
            </div>

            <Button size="lg" onClick={handleStart}>
              Recommencer
            </Button>
            <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={handleReset}>
              Changer de technique
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
