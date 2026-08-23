import type { Technique, TechniqueConfig, Phase } from './types'

export const TECHNIQUES: Record<Technique, TechniqueConfig> = {
  '4-7-8': {
    id: '4-7-8',
    label: '4-7-8',
    description: 'Relaxation profonde — inspire 4s, retiens 7s, expire 8s',
    inhale: 4,
    hold: 7,
    exhale: 8,
    holdAfterExhale: 0,
    totalPerCycle: 19,
  },
  '4-4-4-4': {
    id: '4-4-4-4',
    label: 'Cohérence cardiaque',
    description: 'Équilibre & clarté — inspire 4s, retiens 4s, expire 4s, retiens 4s',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 4,
    totalPerCycle: 16,
  },
}

export const DEFAULT_CYCLES = 4

export const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Inspire',
  hold: 'Retiens',
  exhale: 'Expire',
  holdAfterExhale: 'Retiens',
}
