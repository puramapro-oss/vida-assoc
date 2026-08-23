'use client'

import { useEffect, useMemo, useState } from 'react'
import { Share2, Users, Check, Coins, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { copyToClipboard, formatPrice } from '@/lib/utils'
import { APP_DOMAIN, APP_SHORT_NAME } from '@/lib/constants'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { Profile, Referral, ReferralCommission } from '@/types'
import {
  StatCard,
  ReferralLinkSection,
  TierProgressSection,
  ReferralsList,
  CommissionsList,
} from './components'

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
  { id: 'bronze',   label: 'Bronze',   emoji: '🥉', threshold: 5,   bonus: '+500 crédits Sangha',                  glow: 'from-amber-700/30 to-amber-700/0' },
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
    const span = nxt ? nxt.threshold - cur.threshold : 1
    const prog = nxt ? Math.min(1, (c - cur.threshold) / span) : 1
    return { currentTier: cur, nextTier: nxt, progress: prog }
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
          description="Crée ton compte Sangha pour obtenir ton lien et tes récompenses."
        />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/referral')}>
          Se connecter
        </Button>
      </div>
    )
  }

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
              Partage {APP_SHORT_NAME} avec tes proches. Chaque inscription nourrit l'impact collectif.
            </p>
          </div>
        </div>
      </header>

      <ReferralLinkSection
        referralLink={referralLink}
        referralCode={referralCode}
        copied={copied}
        onCopy={handleCopy}
        onShare={shareNative}
      />

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="referral-stats">
        <StatCard icon={<Users className="h-4 w-4" />} label="Filleuls" value={stats.total.toString()} />
        <StatCard icon={<Check className="h-4 w-4" />} label="Convertis" value={stats.converted.toString()} accent="green" />
        <StatCard icon={<Coins className="h-4 w-4" />} label="Gagné" value={formatPrice(stats.earned)} accent="gold" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="En attente" value={formatPrice(stats.pendingEarn)} />
      </section>

      <TierProgressSection
        currentTier={currentTier}
        nextTier={nextTier}
        progress={progress}
        totalReferrals={stats.total}
        tiers={TIERS}
      />

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">Mes filleuls</h2>
        <ReferralsList referrals={referrals} />
      </section>

      <CommissionsList commissions={commissions} />
    </div>
  )
}
