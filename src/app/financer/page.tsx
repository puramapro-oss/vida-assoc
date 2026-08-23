'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, Download,
  FileText, Heart, Loader2, Search, Sparkles, User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Aide {
  id: string
  nom: string
  type_aide: string
  profil_eligible: string[]
  situation_eligible: string[]
  montant_max: number | null
  url_officielle: string | null
  description: string
  region: string | null
  handicap_only: boolean
}

const PROFILS = [
  { id: 'salarie', label: 'Salarie' },
  { id: 'demandeur_emploi', label: 'Demandeur d\u2019emploi' },
  { id: 'independant', label: 'Independant / auto-entrepreneur' },
  { id: 'etudiant', label: 'Etudiant' },
  { id: 'jeune', label: 'Jeune (16-25 ans)' },
  { id: 'parent', label: 'Parent' },
  { id: 'parent_isole', label: 'Parent isole' },
  { id: 'retraite', label: 'Retraite' },
  { id: 'senior', label: 'Senior (60+)' },
  { id: 'handicape', label: 'Personne en situation de handicap' },
  { id: 'etranger', label: 'Etranger' },
  { id: 'createur', label: 'Createur d\u2019entreprise' },
  { id: 'apprenti', label: 'Apprenti / alternant' },
]

const SITUATIONS = [
  { id: 'faibles_revenus', label: 'Faibles revenus' },
  { id: 'sans_emploi', label: 'Sans emploi' },
  { id: 'perte_emploi_involontaire', label: 'Perte d\u2019emploi involontaire' },
  { id: 'fin_droits_chomage', label: 'Fin de droits chomage' },
  { id: 'handicap', label: 'Handicap reconnu' },
  { id: 'enfant_handicape', label: 'Enfant handicape' },
  { id: 'perte_autonomie', label: 'Perte d\u2019autonomie' },
  { id: '2_enfants_plus', label: '2 enfants ou plus' },
  { id: 'naissance', label: 'Naissance / adoption recente' },
  { id: 'enfant_moins_6ans', label: 'Enfant de moins de 6 ans' },
  { id: 'enfant_6_18ans', label: 'Enfant de 6 a 18 ans' },
  { id: 'renovation_energetique', label: 'Travaux de renovation energetique' },
  { id: 'recherche_logement', label: 'Recherche de logement' },
  { id: 'creation_entreprise', label: 'Creation d\u2019entreprise' },
  { id: 'situation_urgente', label: 'Situation d\u2019urgence' },
  { id: 'reprise_emploi_loin', label: 'Reprise d\u2019emploi loin de chez moi' },
]

const STEPS = [
  { id: 1, label: 'Ton profil', icon: User },
  { id: 2, label: 'Aides disponibles', icon: Search },
  { id: 3, label: 'Ton dossier', icon: FileText },
  { id: 4, label: 'Suivi', icon: Check },
]

export default function FinancerPage() {
  const [step, setStep] = useState(1)
  const [selectedProfils, setSelectedProfils] = useState<string[]>([])
  const [selectedSituations, setSelectedSituations] = useState<string[]>([])
  const [isHandicap, setIsHandicap] = useState(false)
  const [aides, setAides] = useState<Aide[]>([])
  const [matchedAides, setMatchedAides] = useState<Aide[]>([])
  const [loading, setLoading] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.from('aides').select('*').eq('active', true).then(({ data }) => {
      if (data) setAides(data as Aide[])
    })
  }, [supabase])

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  const matchAides = useCallback(() => {
    setLoading(true)
    const matched = aides.filter(aide => {
      if (aide.handicap_only && !isHandicap) return false
      const profilMatch = aide.profil_eligible.length === 0 ||
        aide.profil_eligible.some(p => selectedProfils.includes(p)) ||
        aide.profil_eligible.includes('tous')
      const situationMatch = aide.situation_eligible.length === 0 ||
        aide.situation_eligible.some(s => selectedSituations.includes(s))
      return profilMatch && situationMatch
    })
    setMatchedAides(matched)
    setLoading(false)
    setStep(2)
  }, [aides, selectedProfils, selectedSituations, isHandicap])

  const totalMax = matchedAides.reduce((sum, a) => sum + (a.montant_max ?? 0), 0)

  const generatePdf = useCallback(() => {
    setPdfGenerating(true)
    // Generate a simple text summary as downloadable file
    const lines = [
      'Sangha - Dossier d\u2019aides personnalise',
      '================================================',
      '',
      `Date : ${new Date().toLocaleDateString('fr-FR')}`,
      `Profils : ${selectedProfils.join(', ')}`,
      `Situations : ${selectedSituations.join(', ')}`,
      '',
      `${matchedAides.length} aide(s) identifiee(s) - Cumul potentiel : ${totalMax.toLocaleString('fr-FR')} euros/mois max`,
      '',
      ...matchedAides.map((a, i) => [
        `${i + 1}. ${a.nom}`,
        `   Type : ${a.type_aide}`,
        `   Montant max : ${a.montant_max ? a.montant_max + ' euros/mois' : 'Variable'}`,
        `   ${a.description}`,
        a.url_officielle ? `   Lien : ${a.url_officielle}` : '',
        '',
      ].filter(Boolean).join('\n')),
      '',
      'Ce dossier est genere par Sangha (vida-assoc.purama.dev).',
      'Les montants sont indicatifs et dependent de ta situation exacte.',
      'Consulte chaque lien officiel pour faire ta demande.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dossier-aides-vida.txt'
    a.click()
    URL.revokeObjectURL(url)
    setPdfGenerating(false)
    setStep(4)
  }, [matchedAides, selectedProfils, selectedSituations, totalMax])

  return (
    <div className="min-h-screen bg-[var(--bg-void)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-nebula)]">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--cyan)]">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10B981]/10">
              <Heart className="h-6 w-6 text-[#10B981]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Trouve tes aides</h1>
              <p className="text-sm text-[var(--text-secondary)]">La plupart des utilisateurs Sangha ne paient rien grace aux aides publiques</p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="mt-6 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => { if (s.id < step) setStep(s.id) }}
                  disabled={s.id > step}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                    step >= s.id ? 'bg-[#10B981] text-[#04120c]' : 'bg-white/10 text-[var(--text-muted)]'
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </button>
                <span className={cn('text-xs hidden sm:block', step >= s.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <div className={cn('h-px flex-1', step > s.id ? 'bg-[#10B981]' : 'bg-white/10')} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Qui es-tu ?</h2>
              <p className="text-sm text-[var(--text-secondary)]">Selectionne tout ce qui te correspond</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {PROFILS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      toggleItem(selectedProfils, setSelectedProfils, p.id)
                      if (p.id === 'handicape') setIsHandicap(!selectedProfils.includes(p.id))
                    }}
                    className={cn(
                      'rounded-xl px-4 py-2 text-sm font-medium transition-all border',
                      selectedProfils.includes(p.id)
                        ? 'bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]'
                        : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Ta situation</h2>
              <p className="text-sm text-[var(--text-secondary)]">Selectionne tout ce qui s&apos;applique</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SITUATIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleItem(selectedSituations, setSelectedSituations, s.id)}
                    className={cn(
                      'rounded-xl px-4 py-2 text-sm font-medium transition-all border',
                      selectedSituations.includes(s.id)
                        ? 'bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]'
                        : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={matchAides}
              disabled={selectedProfils.length === 0 && selectedSituations.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-8 py-3 font-semibold text-[#04120c] hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              Voir mes aides <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Matched aides */}
        {step === 2 && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 p-6 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-[#10B981] mb-2" />
                  <p className="text-2xl font-bold text-[#10B981]">{matchedAides.length} aide{matchedAides.length > 1 ? 's' : ''} identifiee{matchedAides.length > 1 ? 's' : ''}</p>
                  {totalMax > 0 && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Cumul potentiel : jusqu&apos;a <strong className="text-[#D4AF37]">{totalMax.toLocaleString('fr-FR')} euros/mois</strong>
                    </p>
                  )}
                </div>

                {matchedAides.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)]">Aucune aide ne correspond exactement a ton profil. Modifie ta selection ou contacte-nous.</p>
                    <button onClick={() => setStep(1)} className="mt-4 text-sm text-[#10B981] hover:underline">Modifier mon profil</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchedAides.map(aide => (
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
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Modifier
                  </button>
                  {matchedAides.length > 0 && (
                    <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-6 py-3 font-semibold text-[#04120c] hover:opacity-90 transition-opacity">
                      Generer mon dossier <FileText className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Generate dossier */}
        {step === 3 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-[#D4AF37] mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Ton dossier est pret</h2>
            <p className="mt-2 text-[var(--text-secondary)] max-w-md mx-auto">
              {matchedAides.length} aide{matchedAides.length > 1 ? 's' : ''} identifiee{matchedAides.length > 1 ? 's' : ''} pour un cumul potentiel de {totalMax.toLocaleString('fr-FR')} euros/mois.
              Telecharge ton recapitulatif avec les liens officiels.
            </p>
            <button
              onClick={generatePdf}
              disabled={pdfGenerating}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-8 py-4 text-lg font-semibold text-[#04120c] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pdfGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              Telecharger mon dossier
            </button>
            <button onClick={() => setStep(2)} className="mt-4 block mx-auto text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Revenir aux resultats
            </button>
          </div>
        )}

        {/* Step 4: Follow-up */}
        {step === 4 && (
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/20 mb-4">
              <Check className="h-8 w-8 text-[#10B981]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Dossier telecharge !</h2>
            <p className="mt-2 text-[var(--text-secondary)] max-w-md mx-auto">
              Consulte chaque lien officiel dans ton dossier pour faire tes demandes.
              La plupart se font en ligne en quelques minutes.
            </p>
            <div className="mt-8 space-y-3 max-w-sm mx-auto text-left">
              {matchedAides.slice(0, 5).map(aide => (
                <div key={aide.id} className="flex items-center gap-3 glass rounded-xl p-3">
                  <div className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0" />
                  <span className="text-sm text-[var(--text-primary)] flex-1">{aide.nom}</span>
                  <span className="text-xs text-[var(--text-muted)]">A faire</span>
                </div>
              ))}
              {matchedAides.length > 5 && (
                <p className="text-xs text-center text-[var(--text-muted)]">+ {matchedAides.length - 5} autre{matchedAides.length - 5 > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-6 py-3 font-semibold text-[#04120c] hover:opacity-90 transition-opacity">
                Rejoindre Sangha gratuitement <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => { setStep(1); setMatchedAides([]) }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-colors">
                Recommencer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
