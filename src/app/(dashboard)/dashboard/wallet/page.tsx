'use client'

import { useEffect, useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { WalletTransaction } from '@/types'
import {
  BalanceCard,
  WithdrawForm,
  WithdrawalsList,
  TransactionsList,
  WalletFooter,
} from './components'

interface WithdrawalRow {
  id: string
  amount_cents: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requested_at: string
  processed_at: string | null
}

export default function WalletPage() {
  const { user, profile, loading: authLoading, refetch } = useAuth()
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [loading, setLoading] = useState(true)

  const [amountEur, setAmountEur] = useState<string>('5')
  const [iban, setIban] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const balance = profile?.wallet_balance_cents ?? 0
  const totalEarned = profile?.total_earned_cents ?? 0
  const minWithdrawCents = 500
  const eligible = balance >= minWithdrawCents

  useEffect(() => {
    if (!user) return
    const sb = createClient()
    ;(async () => {
      const [tx, wd] = await Promise.all([
        sb
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        sb
          .from('withdrawals')
          .select('id, amount_cents, status, requested_at, processed_at')
          .eq('user_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(20),
      ])
      setTransactions((tx.data as WalletTransaction[] | null) ?? [])
      setWithdrawals((wd.data as WithdrawalRow[] | null) ?? [])
      if (profile?.iban && !iban) setIban(profile.iban)
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const monthEarnings = useMemo(() => {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return transactions
      .filter((t) => t.amount_cents > 0 && new Date(t.created_at) >= start)
      .reduce((s, t) => s + t.amount_cents, 0)
  }, [transactions])

  async function submitWithdraw() {
    setError(null)
    setSuccess(false)
    const cents = Math.round(Number(amountEur.replace(',', '.')) * 100)
    if (!Number.isFinite(cents) || cents < minWithdrawCents) {
      setError('Le retrait minimum est de 5 €.')
      return
    }
    if (cents > balance) {
      setError('Solde insuffisant.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_cents: cents, iban }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Retrait impossible')
      setSuccess(true)
      setAmountEur('5')
      await refetch()
      // Refresh local lists
      const sb = createClient()
      const [tx, wd] = await Promise.all([
        sb.from('wallet_transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50),
        sb.from('withdrawals').select('id, amount_cents, status, requested_at, processed_at').eq('user_id', user!.id).order('requested_at', { ascending: false }).limit(20),
      ])
      setTransactions((tx.data as WalletTransaction[] | null) ?? [])
      setWithdrawals((wd.data as WithdrawalRow[] | null) ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Chargement de ton wallet…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState icon="🔒" title="Connecte-toi" description="Accède à ton wallet Sangha après connexion." />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/wallet')}>
          Se connecter
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="wallet-page">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Wallet</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Tes gains réels — récompenses missions, commissions parrainage, gains concours.
          </p>
        </div>
      </header>

      {/* Balance + Withdraw */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <BalanceCard balance={balance} monthEarnings={monthEarnings} totalEarned={totalEarned} />
        <WithdrawForm
          balance={balance}
          minWithdrawCents={minWithdrawCents}
          eligible={eligible}
          amountEur={amountEur}
          setAmountEur={setAmountEur}
          iban={iban}
          setIban={setIban}
          error={error}
          success={success}
          submitting={submitting}
          onSubmit={submitWithdraw}
        />
      </section>

      <WithdrawalsList withdrawals={withdrawals} />
      <TransactionsList transactions={transactions} />
      <WalletFooter />
    </div>
  )
}
