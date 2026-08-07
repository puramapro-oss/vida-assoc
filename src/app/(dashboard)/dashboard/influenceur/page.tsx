'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, Copy, Check, Sparkles, Users, MousePointerClick,
  Coins, Link as LinkIcon, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { copyToClipboard, formatPrice } from '@/lib/utils'
import { APP_DOMAIN, INFLUENCER } from '@/lib/constants'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

interface InfluencerRow {
  id: string
  promo_code: string
  promo_link: string
  bio: string | null
  social_links: Record<string, string>
  approved: boolean
  total_clicks: number
  total_conversions: number
  total_earned_cents: number
  created_at: string
}

export default function InfluencerPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [influencer, setInfluencer] = useState<InfluencerRow | null>(null)
  const [loading, setLoading] = useState(true)

  // Apply form state
  const [code, setCode] = useState('')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [youtube, setYoutube] = useState('')
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setLoading(false))
      return
    }
    const sb = createClient()
    ;(async () => {
      const { data } = await sb
        .from('influencers')
        .select('id, promo_code, promo_link, bio, social_links, approved, total_clicks, total_conversions, total_earned_cents, created_at')
        .eq('user_id', user.id)
        .maybeSingle()
      setInfluencer((data as InfluencerRow | null) ?? null)
      setLoading(false)
    })()
  }, [user])

  const suggestion = useMemo(() => {
    const base = profile?.full_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? ''
    if (base.length >= 3) return base.slice(0, 20)
    const fromEmail = user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? ''
    return fromEmail.slice(0, 20) || 'vida-creator'
  }, [profile?.full_name, user?.email])

  useEffect(() => {
    if (!influencer && !code) queueMicrotask(() => setCode(suggestion))
  }, [influencer, suggestion, code])

  async function submitApply() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/influencer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promo_code: code,
          bio,
          instagram,
          tiktok,
          youtube,
          website,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Inscription impossible.')
      setInfluencer(json.influencer as InfluencerRow)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copy(kind: 'code' | 'link', value: string) {
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl py-12 text-center text-[var(--text-muted)]">Chargement…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState icon="🔒" title="Connecte-toi" description="Deviens créateur Sangha après connexion." />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/influenceur')}>
          Se connecter
        </Button>
      </div>
    )
  }

  // --- NOT INFLUENCER YET : apply form ---
  if (!influencer) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 pb-12" data-testid="influencer-apply">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--purple)]/10 via-transparent to-[var(--cyan)]/10 p-6 md:p-10"
        >
          <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.25),transparent_60%)]" />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--purple)]/15 text-[var(--purple)]">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold">Deviens créateur Sangha</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Reçois <strong>{INFLUENCER.commission_first}%</strong> du premier abo + <strong>{INFLUENCER.commission_recurring}%</strong> à vie. Ton lien donne <strong>-{INFLUENCER.promo_discount}%</strong> à tes filleuls.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Perk icon={<Sparkles className="h-4 w-4" />} title="Acceptation immédiate" body="1 clic, 0 dossier, ton lien est prêt en 2 secondes." />
            <Perk icon={<Coins className="h-4 w-4" />} title="Wallet direct" body="Gains en euros, retrait IBAN dès 5 €." />
            <Perk icon={<Users className="h-4 w-4" />} title="Kit créateur inclus" body="Liens, QR, bannières, textes, images." />
          </div>
        </motion.header>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-semibold">Ton profil créateur</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submitApply()
            }}
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div>
              <label htmlFor="inf-code" className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Code promo
              </label>
              <div className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:border-[var(--cyan)]">
                <span className="flex items-center px-3 text-xs text-[var(--text-muted)]">{APP_DOMAIN}/go/</span>
                <input
                  id="inf-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  maxLength={24}
                  required
                  className="flex-1 bg-transparent px-2 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none"
                  placeholder="ton-code"
                  data-testid="influencer-code"
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">3 à 24 caractères, minuscules, chiffres et tirets.</p>
            </div>

            <div>
              <label htmlFor="inf-bio" className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Bio (facultatif)
              </label>
              <textarea
                id="inf-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[var(--text-primary)] focus:border-[var(--cyan)] focus:outline-none"
                placeholder="Pourquoi tu partages Sangha ?"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field id="inf-ig" label="Instagram" value={instagram} onChange={setInstagram} placeholder="@pseudo" />
              <Field id="inf-tk" label="TikTok" value={tiktok} onChange={setTiktok} placeholder="@pseudo" />
              <Field id="inf-yt" label="YouTube" value={youtube} onChange={setYoutube} placeholder="@chaine" />
              <Field id="inf-web" label="Site" value={website} onChange={setWebsite} placeholder="https://…" />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} icon={<Sparkles className="h-4 w-4" />} data-testid="influencer-apply-btn">
              Créer mon lien créateur
            </Button>
          </form>
        </section>
      </div>
    )
  }

  // --- ALREADY INFLUENCER : dashboard ---
  const totalEarned = influencer.total_earned_cents ?? 0
  const clicks = influencer.total_clicks ?? 0
  const conversions = influencer.total_conversions ?? 0
  const rate = clicks > 0 ? Math.round((conversions / clicks) * 100) : 0

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12" data-testid="influencer-dashboard">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--purple)]/10 via-transparent to-[var(--cyan)]/10 p-6 md:p-8"
      >
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.25),transparent_60%)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--purple)]/15 text-[var(--purple)]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Créateur Sangha</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Actif depuis le {new Date(influencer.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.header>

      {/* Stats */}
      <section className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Clics" value={clicks.toLocaleString('fr-FR')} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Conversions" value={conversions.toLocaleString('fr-FR')} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Taux" value={`${rate}%`} />
        <StatCard icon={<Coins className="h-4 w-4" />} label="Gagné" value={formatPrice(totalEarned)} gold />
      </section>

      {/* Link + code */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold">Ton lien + ton code</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Lien universel</p>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <LinkIcon className="h-4 w-4 shrink-0 text-[var(--cyan)]" />
              <span className="truncate text-sm text-[var(--text-primary)]">{influencer.promo_link}</span>
              <button
                type="button"
                onClick={() => copy('link', influencer.promo_link)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
                data-testid="copy-link"
              >
                {copied === 'link' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === 'link' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Code promo</p>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <Sparkles className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              <span className="font-mono text-sm text-[var(--text-primary)]">{influencer.promo_code}</span>
              <button
                type="button"
                onClick={() => copy('code', influencer.promo_code)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                data-testid="copy-code"
              >
                {copied === 'code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === 'code' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--green)]" />
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Commissions en cours</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {INFLUENCER.commission_first}% du premier abonnement + {INFLUENCER.commission_recurring}% récurrent à vie.
              Retrait IBAN dès 5 € via ton <a href="/dashboard/wallet" className="underline">wallet Sangha</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--cyan)] focus:outline-none"
      />
    </div>
  )
}

function Perk({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-[var(--cyan)]">
        {icon}
        <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{body}</p>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  gold,
}: {
  icon: React.ReactNode
  label: string
  value: string
  gold?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-semibold ${gold ? 'text-[#D4AF37]' : 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  )
}
