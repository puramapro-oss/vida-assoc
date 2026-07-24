'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HandHeart, Send, CheckCircle2, Clock, XCircle } from 'lucide-react'

type CaseType = 'etudiant_rural' | 'handicap' | 'mere_isolee' | 'senior' | 'precarite' | 'jeune_majeur' | 'famille_nombreuse'

const CASE_LABELS: Record<CaseType, string> = {
  etudiant_rural: 'Étudiant·e en zone rurale',
  handicap: 'Situation de handicap',
  mere_isolee: 'Parent isolé·e',
  senior: 'Senior en précarité',
  precarite: 'Précarité financière',
  jeune_majeur: 'Jeune majeur·e (18-25 ans)',
  famille_nombreuse: 'Famille nombreuse',
}

interface BourseCase {
  id: string
  case_type: string
  amount_requested_cents: number
  reason: string
  status: 'pending' | 'reviewing' | 'approved' | 'paid' | 'rejected'
  created_at: string
  rejection_reason: string | null
}

export default function BourseInclusionPage() {
  const [cases, setCases] = useState<BourseCase[]>([])
  const [loading, setLoading] = useState(true)
  const [caseType, setCaseType] = useState<CaseType>('etudiant_rural')
  const [amount, setAmount] = useState('50')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function load() {
    queueMicrotask(() => setLoading(true))
    const res = await fetch('/api/bourse/apply')
    const d = await res.json()
    if (!d.error) queueMicrotask(() => setCases(d.cases ?? []))
    queueMicrotask(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.length < 50) return
    setSubmitting(true)
    const res = await fetch('/api/bourse/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_type: caseType,
        amount_requested_cents: Math.round(parseFloat(amount) * 100),
        reason,
        proof_urls: [],
      }),
    })
    const d = await res.json()
    setSubmitting(false)
    if (!d.error) {
      setSuccess(true)
      setReason('')
      setAmount('50')
      await load()
      setTimeout(() => setSuccess(false), 5000)
    }
  }

  const hasPending = cases.some((c) => c.status === 'pending' || c.status === 'reviewing')

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-3xl">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <HandHeart className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Bourse d&apos;inclusion</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Financée par l&apos;Association PURAMA (subventions + mécénat, circuit parallèle Stripe). Pour les situations
          d&apos;urgence ou d&apos;inclusion prioritaire. Réponse sous 7 jours.
        </p>
      </motion.section>

      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 border border-emerald-500/30">
          <p className="text-sm text-emerald-400 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Dossier reçu. Tu recevras une notification sous 7 jours.
          </p>
        </motion.div>
      )}

      {!hasPending && (
        <section className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-3">Déposer un dossier</h2>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-sm">
              <span className="text-[var(--text-muted)]">Catégorie</span>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value as CaseType)}
                className="mt-1 block w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
              >
                {(Object.keys(CASE_LABELS) as CaseType[]).map((k) => (
                  <option key={k} value={k} className="bg-[#0A0A0F]">
                    {CASE_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-muted)]">Montant demandé (€)</span>
              <input
                type="number"
                min="10"
                max="5000"
                step="5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-muted)]">
                Décris ta situation (50 caractères minimum, {reason.length}/2000)
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 2000))}
                rows={5}
                placeholder="Ex: Je suis étudiante en 2ème année de psychologie à Besançon, je vis à Frasne avec ma mère seule…"
                className="mt-1 block w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || reason.length < 50}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Envoi…' : 'Soumettre mon dossier'}
            </button>
          </form>
        </section>
      )}

      {hasPending && (
        <div className="glass rounded-2xl p-4 border border-amber-500/30">
          <p className="text-sm text-amber-300 inline-flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Un dossier est déjà en cours. Tu peux soumettre un nouveau dossier après traitement.
          </p>
        </div>
      )}

      {cases.length > 0 && (
        <section className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Mes dossiers</h2>
          <ul className="space-y-3">
            {cases.map((c) => (
              <li key={c.id} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-medium">{CASE_LABELS[c.case_type as CaseType] ?? c.case_type}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {(c.amount_requested_cents / 100).toFixed(2)}€ · {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                {c.status === 'rejected' && c.rejection_reason && (
                  <p className="mt-2 text-xs text-red-400">Motif : {c.rejection_reason}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading && <div className="text-[var(--text-muted)] text-sm">Chargement…</div>}

      <p className="text-xs text-[var(--text-muted)]">
        Cette bourse est financée par les dons et subventions perçus par l&apos;Association PURAMA (loi 1901). Elle ne passe pas par Stripe Connect — c&apos;est un circuit d&apos;entraide parallèle.
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: BourseCase['status'] }) {
  const map = {
    pending: { label: 'En attente', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    reviewing: { label: 'En examen', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
    approved: { label: 'Approuvé', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    paid: { label: 'Versé', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    rejected: { label: 'Refusé', cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  }[status]
  const Icon = map.icon
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${map.cls}`}>
      <Icon className="h-3 w-3" />
      {map.label}
    </span>
  )
}
