import Section from './Section'
import { Accessibility } from 'lucide-react'
import type { AccessibilityMode } from '@/types'
import { ACCESS_MODES } from './constants'

export default function AccessibilitySection({
  accessMode,
  setAccessMode,
  multisensorial,
  setMultisensorial,
}: {
  accessMode: AccessibilityMode
  setAccessMode: (mode: AccessibilityMode) => void
  multisensorial: boolean
  setMultisensorial: (enabled: boolean) => void
}) {
  return (
    <Section title="Accessibilité" hint="Sangha s&apos;adapte à ta vie. Choisis le mode le plus confortable.">
      <div className="grid gap-3 md:grid-cols-2">
        {ACCESS_MODES.map((a) => {
          const active = accessMode === a.id
          return (
            <button
              type="button"
              key={a.id}
              onClick={() => setAccessMode(a.id)}
              data-testid={`access-${a.id}`}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                active ? 'border-[var(--cyan)] bg-[var(--cyan)]/10' : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <Accessibility className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-[var(--cyan)]' : 'text-[var(--text-muted)]'}`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{a.label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{a.description}</p>
              </div>
            </button>
          )
        })}
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={multisensorial}
          onChange={(e) => setMultisensorial(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--cyan)]"
          data-testid="multisensorial-toggle"
        />
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Expérience multisensorielle</p>
          <p className="text-xs text-[var(--text-secondary)]">Sons binauraux, vibrations douces, fréquences 432 Hz pendant les rituels.</p>
        </div>
      </label>
    </Section>
  )
}
