'use client'

import { ArrowLeft, ArrowRight, FileText, Loader2, Sparkles } from 'lucide-react'
import type { Aide } from './constants'

interface Step2AidesDisponiblesProps {
  loading: boolean
  matchedAides: Aide[]
  totalMax: number
  onBack: () => void
  onNext: () => void
}

export default function Step2AidesDisponibles({
  loading,
  matchedAides,
  totalMax,
  onBack,
  onNext,
}: Step2AidesDisponiblesProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 p-6 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-[#10B981] mb-2" />
        <p className="text-2xl font-bold text-[#10B981]">
          {matchedAides.length} aide{matchedAides.length > 1 ? 's' : ''} identifiee{matchedAides.length > 1 ? 's' : ''}
        </p>
        {totalMax > 0 && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Cumul potentiel : jusqu&apos;a <strong className="text-[#D4AF37]">{totalMax.toLocaleString('fr-FR')} euros/mois</strong>
          </p>
        )}
      </div>

      {matchedAides.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--text-secondary)]">
            Aucune aide ne correspond exactement a ton profil. Modifie ta selection ou contacte-nous.
          </p>
          <button onClick={onBack} className="mt-4 text-sm text-[#10B981] hover:underline">
            Modifier mon profil
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {matchedAides.map((aide) => (
            <div key={aide.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">{aide.nom}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">{aide.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-lg bg-white/5 px-2 py-1 text-xs text-[var(--text-muted)]">
                      {aide.type_aide}
                    </span>
                    {aide.handicap_only && (
                      <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                        Handicap
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {aide.montant_max ? (
                    <div className="text-lg font-bold text-[#D4AF37]">{aide.montant_max} euros</div>
                  ) : (
                    <div className="text-sm text-[var(--text-muted)]">Variable</div>
                  )}
                  <div className="text-xs text-[var(--text-muted)]">/mois max</div>
                </div>
              </div>
              {aide.url_officielle && (
                <a
                  href={aide.url_officielle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-[#10B981] hover:underline"
                >
                  Voir sur le site officiel <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Modifier
        </button>
        {matchedAides.length > 0 && (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-6 py-3 font-semibold text-[#04120c] hover:opacity-90 transition-opacity"
          >
            Generer mon dossier <FileText className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  )
}
