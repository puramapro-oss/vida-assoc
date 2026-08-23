'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowDownToLine, ArrowUpRight, ShieldCheck, Sparkles, Loader2, CheckCircle2,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { WalletTransaction } from '@/types'

interface WithdrawalRow {
  id: string
  amount_cents: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requested_at: string
  processed_at: string | null
}

const TYPE_LABELS: Record<WalletTransaction['type'], { label: string; icon: string }> = {
  mission_reward:        { label: 'Récompense mission',     icon: '🎯' },
  referral_commission:   { label: 'Commission parrainage',  icon: '🤝' },
  contest_prize:         { label: 'Gain concours',          icon: '🏆' },
  influencer_commission: { label: 'Commission influenceur', icon: '📣' },
  withdrawal:            { label: 'Retrait IBAN',           icon: '💸' },
  refund:                { label: 'Remboursement',          icon: '↩️' },
  bonus:                 { label: 'Bonus',                  icon: '✨' },
  fund_distribution:     { label: 'Redistribution',         icon: '🌱' },
}

// ── Balance Card ──────────────────────────────────────────────────────────────
interface BalanceCardProps {
  balance: number
  monthEarnings: number
  totalEarned: number
}

export function BalanceCard({ balance, monthEarnings, totalEarned }: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-[var(--cyan)]/5 p-6 md:p-8"
    >
      <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.25),transparent_60%)]" />
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Solde disponible</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-5xl md:text-6xl font-bold text-[#D4AF37]" data-testid="wallet-balance">
        {formatPrice(balance)}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Ce mois</p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatPrice(monthEarnings)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Total gagné</p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatPrice(totalEarned)}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Withdraw Form ─────────────────────────────────────────────────────────────
interface WithdrawFormProps {
  balance: number
  minWithdrawCents: number
  eligible: boolean
  amountEur: string
  setAmountEur: (v: string) => void
  iban: string
  setIban: (v: string) => void
  error: string | null
  success: boolean
  submitting: boolean
  onSubmit: () => void
}

export function WithdrawForm({
  balance,
  minWithdrawCents,
  eligible,
  amountEur,
  setAmountEur,
  iban,
  setIban,
  error,
  success,
  submitting,
  onSubmit,
}: WithdrawFormProps) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2">
        <ArrowDownToLine className="h-4 w-4 text-[var(--cyan)]" />
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Retirer en euros</h2>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Virement SEPA, 2-5 jours ouvrés. Minimum 5 €.</p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]" htmlFor="wd-amount">Montant (€)</label>
          <input
            id="wd-amount"
            type="number"
            min={5}
            step={0.5}
            value={amountEur}
            onChange={(e) => setAmountEur(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--cyan)] focus:outline-none"
            data-testid="withdraw-amount"
          />
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[5, 10, 25, 50].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmountEur(String(v))}
                disabled={v * 100 > balance}
                className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-[var(--text-secondary)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-[var(--text-secondary)]"
              >
                {v} €
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]" htmlFor="wd-iban">IBAN</label>
          <input
            id="wd-iban"
            type="text"
            placeholder="FR76 …"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--cyan)] focus:outline-none"
            autoComplete="off"
            spellCheck={false}
            data-testid="withdraw-iban"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-2 rounded-lg border border-[var(--green)]/30 bg-[var(--green)]/10 p-2 text-xs text-[var(--green)]" role="status">
            <CheckCircle2 className="h-4 w-4" /> Demande enregistrée. Tu reçois un email dès le virement.
          </p>
        )}

        <Button
          onClick={onSubmit}
          loading={submitting}
          disabled={!eligible || submitting}
          className="w-full"
          data-testid="withdraw-submit"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : eligible ? 'Demander le retrait' : `Encore ${formatPrice(minWithdrawCents - balance)}`}
        </Button>

        <p className="flex items-center justify-center gap-1 text-[10px] text-[var(--text-muted)]">
          <ShieldCheck className="h-3 w-3" /> IBAN chiffré, conforme RGPD.
        </p>
      </div>
    </aside>
  )
}

// ── Withdrawals List ──────────────────────────────────────────────────────────
interface WithdrawalsListProps {
  withdrawals: WithdrawalRow[]
}

export function WithdrawalsList({ withdrawals }: WithdrawalsListProps) {
  if (withdrawals.length === 0) return null

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">Mes retraits</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
        {withdrawals.map((w) => (
          <div key={w.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="text-[var(--text-primary)]">{formatPrice(w.amount_cents)}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {new Date(w.requested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                w.status === 'completed'
                  ? 'bg-[var(--green)]/15 text-[var(--green)]'
                  : w.status === 'failed'
                    ? 'bg-red-500/10 text-red-300'
                    : 'bg-amber-500/10 text-amber-300'
              }`}
            >
              {w.status === 'pending' ? 'en attente' : w.status === 'processing' ? 'en cours' : w.status === 'completed' ? 'envoyé' : 'échoué'}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Transactions List ─────────────────────────────────────────────────────────
interface TransactionsListProps {
  transactions: WalletTransaction[]
}

export function TransactionsList({ transactions }: TransactionsListProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Historique</h2>
        <Link href="/dashboard/missions" className="inline-flex items-center gap-1 text-xs text-[var(--cyan)] hover:underline">
          Gagner plus <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      {transactions.length === 0 ? (
        <EmptyState
          icon="✨"
          title="Aucune transaction"
          description="Complète une mission ou parraine un ami pour faire grandir ton wallet."
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
          {transactions.map((t) => {
            const meta = TYPE_LABELS[t.type] ?? { label: t.type, icon: '•' }
            const positive = t.amount_cents >= 0
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm" data-testid="wallet-tx">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-base">{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--text-primary)]">{meta.label}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {t.description ?? '—'} · {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <p className={`shrink-0 font-semibold ${positive ? 'text-[var(--green)]' : 'text-red-300'}`}>
                  {positive ? '+' : ''}{formatPrice(t.amount_cents)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
export function WalletFooter() {
  return (
    <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-[var(--text-muted)] flex items-start gap-2">
      <Sparkles className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
      <p>
        Ton wallet est alimenté par tes actions concrètes : missions validées, parrainages convertis, gains de concours.
        Aucune commission Sangha — 100 % de tes gains te reviennent.
      </p>
    </footer>
  )
}
