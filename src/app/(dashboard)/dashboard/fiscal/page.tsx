'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Shield, Info } from 'lucide-react'

interface TaxInfo {
  profile: 'particulier_occ' | 'bnc' | 'autoentrepreneur' | 'entreprise'
  label: string
  cumul_annual_cents: number
  message: {
    headline: string
    body: string
    action_required: 'none' | 'siret' | 'declaration' | 'expert_comptable'
  }
  should_escalate: boolean
}

export default function FiscalPage() {
  const [info, setInfo] = useState<TaxInfo | null>(null)
  const [siret, setSiret] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/tax/detect')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setInfo(d as TaxInfo)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function submitSiret(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{14}$/.test(siret)) return
    setSubmitting(true)
    const res = await fetch('/api/tax/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siret }),
    })
    const d = await res.json()
    if (!d.error) setInfo(d as TaxInfo)
    setSubmitting(false)
  }

  if (loading) {
    return <div className="p-6 text-[var(--text-muted)]">Chargement…</div>
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-3xl">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Mon espace fiscal</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Sangha te génère un Factur-X (PDF + XML) pour chaque versement. Tu déclares sur impots.gouv.fr — zéro erreur de format.
        </p>
      </motion.section>

      {info && (
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h2 className="font-semibold">{info.label}</h2>
          </div>
          <h3 className="text-base font-medium mt-2">{info.message.headline}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{info.message.body}</p>
          {info.should_escalate && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300 inline-flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Ton cumul annuel te place au-dessus du seuil du régime actuel. Déclare ton SIRET ci-dessous pour
                passer au régime adapté.
              </span>
            </div>
          )}
        </section>
      )}

      <section className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-1">Déclarer mon SIRET (optionnel)</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Si tu es auto-entrepreneur ou as une société, renseigne ton SIRET pour que Sangha génère des Factur-X
          à ton nom.
        </p>
        <form onSubmit={submitSiret} className="flex flex-col sm:flex-row gap-2">
          <input
            value={siret}
            onChange={(e) => setSiret(e.target.value.replace(/\s/g, ''))}
            placeholder="14 chiffres"
            inputMode="numeric"
            pattern="\d{14}"
            maxLength={14}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={submitting || !/^\d{14}$/.test(siret)}
            className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Vérification…' : 'Valider'}
          </button>
        </form>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-2">Cadre légal</h2>
        <ul className="text-xs text-[var(--text-muted)] space-y-1.5">
          <li>• Stripe Connect Express (STEL, licence EMI passportée, validée ACPR).</li>
          <li>• Sangha fournit Factur-X conforme Chorus Pro — tu restes seul·e déclarant·e.</li>
          <li>• Factur-X conforme norme Chorus Pro (PDF/A-3 + XML).</li>
          <li>• Données fiscales chiffrées, RGPD, conservation 10 ans.</li>
        </ul>
      </section>
    </div>
  )
}
