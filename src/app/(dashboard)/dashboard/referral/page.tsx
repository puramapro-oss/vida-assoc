'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Share2, Copy, Check, Users, Coins, Trophy,
  MessageCircle, Mail, Send, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { copyToClipboard, formatPrice } from '@/lib/utils'
import { APP_DOMAIN, APP_SHORT_NAME } from '@/lib/constants'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { Profile, Referral, ReferralCommission } from '@/types'

interface Tier {
  id: string
  label: string
  emoji: string
  threshold: number
  bonus: string
  glow: string
}

const TIERS: Tier[] = [
  { id: 'graine',   label: 'Graine',   emoji: '🌱', threshold: 0,   bonus: 'Bienvenue dans la famille',           glow: 'from-emerald-500/20 to-emerald-500/0' },
  { id: 'bronze',   label: 'Bronze',   emoji: '🥉', threshold: 5,   bonus: '+500 crédits VIDA',                  glow: 'from-amber-700/30 to-amber-700/0' },
  { id: 'argent',   label: 'Argent',   emoji: '🥈', threshold: 10,  bonus: '+5 € wallet + ticket concours',        glow: 'from-slate-300/30 to-slate-300/0' },
  { id: 'or',       label: 'Or',       emoji: '🥇', threshold: 25,  bonus: 'Premium offert 1 mois',                glow: 'from-yellow-400/30 to-yellow-400/0' },
  { id: 'platine',  label: 'Platine',  emoji: '💠', threshold: 50,  bonus: '+50 € wallet + page perso',            glow: 'from-cyan-300/30 to-cyan-300/0' },
  { id: 'diamant',  label: 'Diamant',  emoji: '💎', threshold: 75,  bonus: 'VIP, accès anticipé features',         glow: 'from-sky-300/30 to-sky-300/0' },
  { id: 'legende',  label: 'Légende',  emoji: '🌟', threshold: 100, bonus: 'Commission héréditaire à vie',         glow: 'from-fuchsia-400/30 to-fuchsia-400/0' },
]

interface ReferralRow extends Referral {
  referred?: Pick<Profile, 'id' | 'email' | 'full_name' | 'plan' | 'created_at'> | null
}

export default function ReferralPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [commissions, setCommissions] = useState<ReferralCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  const referralCode = profile?.referral_code ?? ''
  const referralLink = referralCode ? `https://${APP_DOMAIN}/go/${referralCode}` : ''

  useEffect(() => {
    if (!user) return
    const sb = createClient()
    ;(async () => {
      const [refs, comms] = await Promise.all([
        sb
          .from('referrals')
          .select('*, referred:referred_id(id, email, full_name, plan, created_at)')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        sb
          .from('referral_commissions')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      setReferrals((refs.data as ReferralRow[] | null) ?? [])
      setCommissions((comms.data as ReferralCommission[] | null) ?? [])
      setLoading(false)
    })()
  }, [user])

  const stats = useMemo(() => {
    const total = referrals.length
    const converted = referrals.filter((r) => r.status === 'converted' || r.status === 'active').length
    const pending = total - converted
    const earned = commissions
      .filter((c) => c.status === 'paid' || c.status === 'approved')
      .reduce((s, c) => s + c.amount_cents, 0)
    const pendingEarn = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount_cents, 0)
    return { total, converted, pending, earned, pendingEarn }
  }, [referrals, commissions])

  const { currentTier, nextTier, progress } = useMemo(() => {
    const c = stats.total
    let cur = TIERS[0]
    let nxt: Tier | null = null
    for (let i = 0; i < TIERS.length; i++) {
      if (c >= TIERS[i].threshold) {
        cur = TIERS[i]
        nxt = TIERS[i + 1] ?? null
      }
    }
    const remaining = nxt ? Math.max(0, nxt.threshold - c) : 0
    const span = nxt ? nxt.threshold - cur.threshold : 1
    const prog = nxt ? Math.min(1, (c - cur.threshold) / span) : 1
    return { currentTier: cur, nextTier: nxt, progress: prog, remaining }
  }, [stats.total])

  async function handleCopy(value: string, kind: 'link' | 'code') {
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    }
  }

  function shareNative() {
    if (typeof navigator === 'undefined') return
    const text = `Rejoins-moi sur ${APP_SHORT_NAME} pour transformer chaque don en impact réel 🌱`
    if (navigator.share) {
      navigator.share({ title: APP_SHORT_NAME, text, url: referralLink }).catch(() => undefined)
    } else {
      handleCopy(referralLink, 'link')
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Chargement de ton parrainage…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState
          icon="🔒"
          title="Connecte-toi pour parrainer"
          description="Crée ton compte VIDA pour obtenir ton lien et tes récompenses."
        />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/referral')}>
          Se connecter
        </Button>
      </div>
    )
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME} 🌱 ${referralLink}`)}`
  const sms = `sms:?body=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME} 🌱 ${referralLink}`)}`
  const tg = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME} 🌱`)}`
  const mailto = `mailto:?subject=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME}`)}&body=${encodeURIComponent(`Salut !\n\nJe pense que ${APP_SHORT_NAME} pourrait te plaire. C’est une plateforme d’engagement solidaire qui transforme chaque action en impact réel.\n\nVoici mon lien : ${referralLink}\n\nÀ très vite 🌱`)}`

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="referral-page">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cyan)]/10 text-[var(--cyan)]">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
              Parrainage
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Partage {APP_SHORT_NAME} avec tes proches. Chaque inscription nourrit l’impact collectif.
            </p>
          </div>
        </div>
      </header>

      {/* Lien parrainage */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--cyan)]/5 via-transparent to-[var(--purple)]/5 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Ton lien personnel</p>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Share2 className="h-4 w-4 shrink-0 text-[var(--cyan)]" />
              <input
                readOnly
                value={referralLink}
                aria-label="Lien de parrainage"
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                data-testid="referral-link"
              />
              <button
                type="button"
                onClick={() => handleCopy(referralLink, 'link')}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition"
                data-testid="copy-link"
              >
                {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Code : <button type="button" onClick={() => handleCopy(referralCode, 'code')} className="font-mono text-[var(--cyan)] hover:underline" data-testid="copy-code">{referralCode || '—'}</button>
              {copied === 'code' && <span className="ml-2 text-[var(--green)]">copié !</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={shareNative} icon={<Share2 className="h-4 w-4" />} data-testid="share-native">
              Partager
            </Button>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-[var(--green)] hover:text-[var(--green)] transition" data-testid="share-whatsapp">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a href={sms} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition" data-testid="share-sms">
              <Send className="h-4 w-4" /> SMS
            </a>
            <a href={tg} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition">
              <Send className="h-4 w-4" /> Telegram
            </a>
            <a href={mailto} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition">
              <Mail className="h-4 w-4" /> Email
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="referral-stats">
        <StatCard icon={<Users className="h-4 w-4" />} label="Filleuls" value={stats.total.toString()} />
        <StatCard icon={<Check className="h-4 w-4" />} label="Convertis" value={stats.converted.toString()} accent="green" />
        <StatCard icon={<Coins className="h-4 w-4" />} label="Gagné" value={formatPrice(stats.earned)} accent="gold" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="En attente" value={formatPrice(stats.pendingEarn)} />
      </section>

      {/* Palier */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Palier actuel</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              <span className="mr-2 text-3xl">{currentTier.emoji}</span>{currentTier.label}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{currentTier.bonus}</p>
          </div>
          {nextTier && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Prochain palier</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{nextTier.emoji} {nextTier.label}</p>
              <p className="text-xs text-[var(--text-muted)]">
                Plus que <span className="text-[var(--cyan)]">{Math.max(0, nextTier.threshold - stats.total)}</span> filleul·s
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--cyan)] via-emerald-400 to-[var(--purple)]"
          />
        </div>

        <div className="mt-6 grid grid-cols-3 md:grid-cols-7 gap-2">
          {TIERS.map((t) => {
            const reached = stats.total >= t.threshold
            const active = t.id === currentTier.id
            return (
              <div
                key={t.id}
                className={`relative rounded-2xl border p-3 text-center transition ${
                  active
                    ? 'border-[var(--cyan)] bg-[var(--cyan)]/10'
                    : reached
                      ? 'border-white/15 bg-white/5'
                      : 'border-white/5 bg-white/[0.02] opacity-60'
                }`}
              >
                <div className="text-xl">{t.emoji}</div>
                <p className="mt-1 text-[11px] font-semibold text-[var(--text-primary)]">{t.label}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{t.threshold}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Filleuls */}
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">Mes filleuls</h2>
        {referrals.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="Personne encore"
            description="Partage ton lien sur WhatsApp ou Instagram pour démarrer ton arbre VIDA."
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {r.referred?.full_name || r.referred?.email || 'Filleul'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {r.referred?.plan && ` · plan ${r.referred.plan}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    r.status === 'active' || r.status === 'converted'
                      ? 'bg-[var(--green)]/15 text-[var(--green)]'
                      : r.status === 'churned'
                        ? 'bg-red-500/10 text-red-300'
                        : 'bg-white/10 text-[var(--text-muted)]'
                  }`}
                >
                  {r.status === 'pending' ? 'inscrit' : r.status === 'converted' ? 'converti' : r.status === 'active' ? 'actif' : 'parti'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Commissions */}
      {commissions.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">Mes commissions</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-[var(--text-primary)]">
                    {c.commission_type === 'first_subscription' ? 'Premier abonnement' : c.commission_type === 'recurring' ? 'Récurrent' : c.commission_type === 'cross_app' ? 'Cross-app' : 'Bonus'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${c.status === 'paid' || c.status === 'approved' ? 'text-[var(--green)]' : 'text-[var(--text-secondary)]'}`}>
                    +{formatPrice(c.amount_cents)}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">{c.status}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <a href="/dashboard/wallet" className="inline-flex items-center gap-1 text-xs text-[var(--cyan)] hover:underline">
              Voir mon wallet <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: 'green' | 'gold' }) {
  const color = accent === 'green' ? 'text-[var(--green)]' : accent === 'gold' ? 'text-[#D4AF37]' : 'text-[var(--text-primary)]'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between text-[var(--text-muted)]">
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className={`mt-2 text-xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}
