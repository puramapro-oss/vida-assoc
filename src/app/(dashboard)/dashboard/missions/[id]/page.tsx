'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Clock, Camera, Check, Loader2, Sparkles, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useHaptic, useSound432 } from '@/hooks/useMultisensorial'
import { createClient } from '@/lib/supabase'
import { MISSION_CATEGORIES } from '@/lib/constants'
import { formatPrice, formatCredits } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Mission, MissionCompletion } from '@/types'

type Step = 'view' | 'proof' | 'submitting' | 'done'

export default function MissionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, profile } = useAuth()
  const haptic = useHaptic()
  const playTone = useSound432()
  const [mission, setMission] = useState<Mission | null>(null)
  const [existing, setExisting] = useState<MissionCompletion | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('view')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [proofText, setProofText] = useState('')
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params?.id) return
    const sb = createClient()
    ;(async () => {
      const { data } = await sb.from('missions').select('*').eq('id', params.id).maybeSingle()
      setMission((data as Mission | null) ?? null)
      if (user) {
        const { data: comp } = await sb
          .from('mission_completions')
          .select('*')
          .eq('mission_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setExisting((comp as MissionCompletion | null) ?? null)
        if (comp) setStep('done')
      }
      setLoading(false)
    })()
  }, [params?.id, user])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      setError('Photo trop lourde (max 10 Mo).')
      return
    }
    setError(null)
    setProofFile(f)
    setProofPreview(URL.createObjectURL(f))
  }

  function captureGps() {
    if (!navigator.geolocation) {
      setError("Géolocalisation indisponible sur ton navigateur.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("On n'a pas pu te localiser. Tu peux quand même envoyer ta preuve."),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  async function submitProof() {
    if (!mission || !user) return
    setStep('submitting')
    setError(null)
    try {
      const sb = createClient()
      let proofUrl: string | null = null
      if (proofFile) {
        const ext = proofFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${mission.id}-${Date.now()}.${ext}`
        const { error: upErr } = await sb.storage
          .from('vida-proofs')
          .upload(path, proofFile, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        proofUrl = path
      }

      const res = await fetch(`/api/missions/${mission.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_photo_url: proofUrl,
          proof_text: proofText.trim() || null,
          proof_gps_lat: gps?.lat ?? null,
          proof_gps_lng: gps?.lng ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Envoi impossible')
      setExisting(json.completion as MissionCompletion)
      setStep('done')
      haptic('celebration')
      playTone({ duration: 1.8, frequency: 528 })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue.'
      setError(msg)
      setStep('proof')
      haptic('warn')
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl py-10 text-center text-[var(--text-muted)]">Chargement de la mission…</div>
  }
  if (!mission) {
    return (
      <div className="mx-auto max-w-3xl py-10 text-center">
        <p className="text-[var(--text-secondary)]">Cette mission n&apos;existe plus ou n&apos;est pas publique.</p>
        <Button onClick={() => router.push('/dashboard/missions')} className="mt-4">
          Retour aux missions
        </Button>
      </div>
    )
  }

  const cat = MISSION_CATEGORIES.find((c) => c.id === mission.category_id)
  const reward =
    mission.reward_amount_cents > 0
      ? formatPrice(mission.reward_amount_cents)
      : mission.reward_vida_credits > 0
      ? formatCredits(mission.reward_vida_credits)
      : `${mission.reward_contest_tickets} ticket(s) concours`

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10" data-testid="mission-detail">
      <Link
        href="/dashboard/missions"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[#10B981]"
      >
        <ArrowLeft className="h-4 w-4" /> Toutes les missions
      </Link>

      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden>
            {cat?.icon ?? '✨'}
          </span>
          <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{cat?.name ?? mission.type}</span>
          {mission.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] text-[#D4AF37]">
              <Sparkles className="h-3 w-3" /> À la une
            </span>
          )}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
          {mission.title}
        </h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">{mission.description}</p>

        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
          {mission.location_name && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {mission.location_name}
            </span>
          )}
          {mission.duration_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {mission.duration_minutes} min
            </span>
          )}
          {mission.is_collective && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> Collective ({mission.current_participants}/{mission.max_participants})
            </span>
          )}
        </div>
      </motion.header>

      <section className="rounded-2xl border border-[#10B981]/20 bg-gradient-to-br from-[#10B981]/10 to-[#D4AF37]/5 p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Récompense à la validation</p>
        <p className="mt-1 text-2xl font-semibold text-[#D4AF37]">{reward}</p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Vérification : <span className="text-[var(--text-primary)]">{mission.verification_method.replace('_', ' ')}</span>
          {mission.proof_required && ' — preuve obligatoire'}
        </p>
      </section>

      {step === 'done' && existing ? (
        <section className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-5 text-center" data-testid="mission-done">
          <Check className="mx-auto h-10 w-10 text-[#10B981]" />
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold">Preuve envoyée</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Statut :{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {existing.status === 'pending' ? 'En cours de validation par Sangha' : existing.status === 'validated' ? 'Validée' : existing.status === 'rejected' ? 'Refusée' : 'Litige'}
            </span>
          </p>
          {existing.status === 'validated' && existing.reward_paid && (
            <p className="mt-2 text-sm text-[#D4AF37]">Récompense créditée à ton compte ✨</p>
          )}
          <Button onClick={() => router.push('/dashboard/missions')} className="mt-5" variant="secondary">
            Voir d&apos;autres missions
          </Button>
        </section>
      ) : step === 'view' ? (
        <Button
          onClick={() => {
            if (!user) {
              router.push(`/login?next=/dashboard/missions/${mission.id}`)
              return
            }
            setStep('proof')
          }}
          size="lg"
          className="w-full"
          data-testid="mission-start"
        >
          Je la fais ✨
        </Button>
      ) : (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">1. Dépose ta preuve</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Une photo claire — Sangha la valide automatiquement et débloque ta récompense.
            </p>
            <label
              htmlFor="proof-file"
              className="mt-3 flex h-44 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-[#10B981]/60 hover:bg-[#10B981]/[0.04]"
            >
              {proofPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofPreview} alt="Aperçu" className="max-h-full max-w-full rounded-lg object-contain" />
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <Camera className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-xs">Touche pour choisir ou prendre une photo</p>
                </div>
              )}
              <input
                id="proof-file"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFileChange}
                className="hidden"
                data-testid="proof-file"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">2. Localisation (optionnel)</p>
            <button
              type="button"
              onClick={captureGps}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[#10B981]/40 hover:text-[#10B981]"
            >
              <MapPin className="h-3 w-3" />
              {gps ? `Position enregistrée (${gps.lat.toFixed(3)}, ${gps.lng.toFixed(3)})` : 'Capturer ma position'}
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">3. Quelques mots (optionnel)</p>
            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Comment s'est passée ta mission ? Qu'as-tu ressenti ?"
              data-testid="proof-text"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#10B981] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('view')} disabled={step === 'submitting'}>
              Retour
            </Button>
            <Button
              onClick={submitProof}
              loading={step === 'submitting'}
              disabled={!proofFile || step === 'submitting'}
              className="flex-1"
              data-testid="proof-submit"
            >
              {step === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…
                </>
              ) : (
                'Envoyer ma preuve'
              )}
            </Button>
          </div>

          {profile?.plan === 'free' && (
            <p className="text-center text-[10px] text-[var(--text-muted)]">
              Compte Découverte : 3 missions/mois gratuites — passe à Sangha One pour des missions illimitées.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
