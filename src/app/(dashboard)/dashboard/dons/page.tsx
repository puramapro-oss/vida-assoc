'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Search, Loader2, BadgeCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { Association, Donation } from '@/types'

const PRESET_AMOUNTS_CENTS = [500, 1000, 2500, 5000, 10000] as const

export default function DonsPage() {
  const { user, loading: authLoading } = useAuth()
  const [associations, setAssociations] = useState<Association[]>([])
  const [history, setHistory] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Association | null>(null)
  const [amount, setAmount] = useState<number>(1000)
  const [recurring, setRecurring] = useState<'none' | 'monthly' | 'yearly'>('none')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const [{ data: assos }, hist] = await Promise.all([
        sb.from('associations').select('*').eq('verified', true).order('featured', { ascending: false }).order('impact_score', { ascending: false }).limit(60),
        user
          ? sb.from('donations').select('*').eq('donor_id', user.id).order('created_at', { ascending: false }).limit(20)
          : Promise.resolve({ data: [] as Donation[] }),
      ])
      setAssociations((assos as Association[] | null) ?? [])
      setHistory((hist.data as Donation[] | null) ?? [])
      setLoading(false)
    })()
  }, [user])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return associations
    return associations.filter((a) => `${a.name} ${a.description ?? ''} ${a.category ?? ''}`.toLowerCase().includes(q))
  }, [associations, search])

  async function startDonation() {
    if (!user) {
      window.location.href = '/login?next=/dashboard/dons'
      return
    }
    if (!selected) {
      setError('Choisis une association.')
      return
    }
    if (amount < 100) {
      setError('Le don minimum est de 1 €.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_type: 'association',
          recipient_id: selected.id,
          amount_cents: amount,
          recurring: recurring === 'none' ? null : recurring,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Don impossible')
      window.location.href = json.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Chargement des associations…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="dons-page">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
          Faire un <span className="text-[#D4AF37]">don</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Chaque euro est tracé. 100 % part à l&apos;association choisie — VIDA prend 0 % sur les dons aux autres.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une association par nom ou cause…"
              data-testid="dons-search"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="❤️" title="Aucune association trouvée" description="Essaie un autre nom ou catégorie." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((a, i) => (
                <motion.button
                  key={a.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => setSelected(a)}
                  data-testid="asso-card"
                  className={`text-left rounded-2xl border p-4 transition ${
                    selected?.id === a.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{a.name}</h3>
                    {a.verified && <BadgeCheck className="h-4 w-4 text-[#10B981]" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{a.description}</p>
                  {a.category && (
                    <span className="mt-3 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      {a.category}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 lg:sticky lg:top-4 h-fit">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#D4AF37]" /> Mon don
          </h2>
          {selected ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Bénéficiaire : <span className="font-semibold text-[var(--text-primary)]">{selected.name}</span>
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Choisis une association à gauche pour commencer.</p>
          )}

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Montant</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS_CENTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`rounded-lg border py-2 text-sm transition ${
                    amount === v
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                  }`}
                >
                  {formatPrice(v)}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={5000}
              step={1}
              value={(amount / 100).toString()}
              onChange={(e) => setAmount(Math.max(0, Math.round(Number(e.target.value) * 100)))}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#D4AF37] focus:outline-none"
              aria-label="Montant personnalisé en euros"
              data-testid="dons-amount"
            />
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Fréquence</p>
            <div className="grid grid-cols-3 gap-2">
              {(['none', 'monthly', 'yearly'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurring(r)}
                  className={`rounded-lg border py-2 text-xs transition ${
                    recurring === r
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                  }`}
                >
                  {r === 'none' ? 'Ponctuel' : r === 'monthly' ? 'Mensuel' : 'Annuel'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300" role="alert">
              {error}
            </p>
          )}

          <Button onClick={startDonation} loading={submitting} className="w-full" data-testid="dons-submit">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Donner ${formatPrice(amount)}`}
          </Button>

          <p className="text-[10px] text-[var(--text-muted)] text-center">
            Paiement sécurisé Stripe — carte, Apple Pay, PayPal, Link.
          </p>
        </aside>
      </div>

      {history.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">Mes derniers dons</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
            {history.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[var(--text-secondary)]">
                  {new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {d.is_recurring && ` · ${d.recurring_interval === 'monthly' ? 'mensuel' : 'annuel'}`}
                </span>
                <span className={`font-semibold ${d.status === 'succeeded' ? 'text-[#D4AF37]' : 'text-[var(--text-muted)]'}`}>
                  {formatPrice(d.amount_cents)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
