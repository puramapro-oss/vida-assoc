'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Split, Save } from 'lucide-react'

interface SmartSplitProps {
  userSharePercent: number
  assoSharePercent: number
  sasuSharePercent: number
  onSave?: (s: { user: number; asso: number; sasu: number }) => Promise<void>
  readOnly?: boolean
}

export function SmartSplit({
  userSharePercent = 70,
  assoSharePercent = 10,
  sasuSharePercent = 20,
  onSave,
  readOnly = false,
}: SmartSplitProps) {
  const [user, setUser] = useState(userSharePercent)
  const [asso, setAsso] = useState(assoSharePercent)
  const [saving, setSaving] = useState(false)
  const sasu = Math.max(0, 100 - user - asso)

  async function handleSave() {
    if (!onSave || user + asso > 100) return
    setSaving(true)
    await onSave({ user, asso, sasu })
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Split className="h-4 w-4 text-emerald-400" />
        <h3 className="font-semibold">Smart Split</h3>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Configure la répartition de chaque paiement effectué avec ta Purama Card.
      </p>

      <div className="flex flex-col gap-3">
        <SplitRow label="Toi (wallet)" value={user} color="emerald" onChange={(v) => !readOnly && setUser(v)} disabled={readOnly} />
        <SplitRow label="Asso de ton choix" value={asso} color="rose" onChange={(v) => !readOnly && setAsso(v)} disabled={readOnly} max={50} />
        <SplitRow label="Sangha (SASU)" value={sasu} color="cyan" disabled />
      </div>

      {!readOnly && onSave && (
        <button
          onClick={handleSave}
          disabled={saving || user + asso > 100}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      )}
    </motion.div>
  )
}

function SplitRow({
  label,
  value,
  color,
  onChange,
  disabled,
  max = 100,
}: {
  label: string
  value: number
  color: 'emerald' | 'rose' | 'cyan'
  onChange?: (v: number) => void
  disabled?: boolean
  max?: number
}) {
  const bg = color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : 'bg-cyan-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${bg}`} style={{ width: `${value}%` }} />
      </div>
      {onChange && !disabled && (
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full mt-1 accent-emerald-500"
        />
      )}
    </div>
  )
}
