'use client'

import { motion } from 'framer-motion'
import {
  Share2, Copy, Check, MessageCircle, Mail, Send, ArrowUpRight,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { APP_SHORT_NAME } from '@/lib/constants'
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

interface ReferralRow extends Referral {
  referred?: Pick<Profile, 'id' | 'email' | 'full_name' | 'plan' | 'created_at'> | null
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  accent?: 'green' | 'gold'
}

export function StatCard({ icon, label, value, accent }: StatCardProps) {
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

// ── Referral Link Section ─────────────────────────────────────────────────────
interface ReferralLinkSectionProps {
  referralLink: string
  referralCode: string
  copied: 'link' | 'code' | null
  onCopy: (value: string, kind: 'link' | 'code') => void
  onShare: () => void
}

export function ReferralLinkSection({
  referralLink,
  referralCode,
  copied,
  onCopy,
  onShare,
}: ReferralLinkSectionProps) {
  const wa = `https://wa.me/?text=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME} 🌱 ${referralLink}`)}`
  const sms = `sms:?body=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME} 🌱 ${referralLink}`)}`
  const tg = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME} 🌱`)}`
  const mailto = `mailto:?subject=${encodeURIComponent(`Rejoins-moi sur ${APP_SHORT_NAME}`)}&body=${encodeURIComponent(`Salut !\n\nJe pense que ${APP_SHORT_NAME} pourrait te plaire. C'est une plateforme d'engagement solidaire qui transforme chaque action en impact réel.\n\nVoici mon lien : ${referralLink}\n\nÀ très vite 🌱`)}`

  return (
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
              onClick={() => onCopy(referralLink, 'link')}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition"
              data-testid="copy-link"
            >
              {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Code : <button type="button" onClick={() => onCopy(referralCode, 'code')} className="font-mono text-[var(--cyan)] hover:underline" data-testid="copy-code">{referralCode || '—'}</button>
            {copied === 'code' && <span className="ml-2 text-[var(--green)]">copié !</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onShare} icon={<Share2 className="h-4 w-4" />} data-testid="share-native">
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
  )
}

// ── Tier Progress Section ─────────────────────────────────────────────────────
interface TierProgressSectionProps {
  currentTier: Tier
  nextTier: Tier | null
  progress: number
  totalReferrals: number
  tiers: Tier[]
}

export function TierProgressSection({
  currentTier,
  nextTier,
  progress,
  totalReferrals,
  tiers,
}: TierProgressSectionProps) {
  return (
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
              Plus que <span className="text-[var(--cyan)]">{Math.max(0, nextTier.threshold - totalReferrals)}</span> filleul·s
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
        {tiers.map((t) => {
          const reached = totalReferrals >= t.threshold
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
  )
}

// ── Referrals List ────────────────────────────────────────────────────────────
interface ReferralsListProps {
  referrals: ReferralRow[]
}

export function ReferralsList({ referrals }: ReferralsListProps) {
  if (referrals.length === 0) {
    return (
      <EmptyState
        icon="🌱"
        title="Personne encore"
        description="Partage ton lien sur WhatsApp ou Instagram pour démarrer ton arbre Sangha."
      />
    )
  }

  return (
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
  )
}

// ── Commissions List ──────────────────────────────────────────────────────────
interface CommissionsListProps {
  commissions: ReferralCommission[]
}

export function CommissionsList({ commissions }: CommissionsListProps) {
  if (commissions.length === 0) return null

  return (
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
  )
}
