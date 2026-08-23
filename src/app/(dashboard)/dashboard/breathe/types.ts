export type Technique = '4-7-8' | '4-4-4-4'

export interface TechniqueConfig {
  id: Technique
  label: string
  description: string
  inhale: number
  hold: number
  exhale: number
  holdAfterExhale: number
  totalPerCycle: number
}

export type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale'
export type AppState = 'ready' | 'breathing' | 'done'
