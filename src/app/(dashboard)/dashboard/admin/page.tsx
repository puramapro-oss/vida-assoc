'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield, Users, HandHeart, Heart, CheckCircle2, XCircle,
  Sparkles, Loader2, ArrowUpRight, Trophy, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

interface Stats {
  totalUsers: number
  totalMissions: number
  pendingCompletions: number
  totalDonated: number
  totalImpact: number
  totalEarned: number
}

interface PendingCompletion {
  id: string
  mission_id: string
  user_id: string
  proof_photo_url: string | null
  proof_gps_lat: number | null
  proof_gps_lng: number | null
  proof_text: string | null
  ai_validation_score: number | null
  created_at: string
  mission_title: string | null
  mission_category: string | null
  user_name: string | null
  user_email: string | null
}

export default function AdminPage() {
  const { user, profile, loading: authLoading, isSuperAdmin } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pending, setPending] = useState<PendingCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !isSuperAdmin) {
      setLoading(false)
      return
    }
    const sb = createClient()

    ;(async () => {
      const [
        usersRes,
        missionsRes,
        pendingRes,
        donationsRes,
        profileSums,
      ] = await Promise.all([
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb.from('missions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        sb
          .from('mission_completions')
          .select(
            'id, mission_id, user_id, proof_photo_url, proof_gps_lat, proof_gps_lng, proof_text, ai_validation_score, created_at',
          )
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(30),
        sb.from('donations').select('amount_cents').eq('status', 'succeeded'),
        sb.from('profiles').select('impact_score, total_earned_cents'),
      ])

      const totalDonated =
        ((donationsRes.data as { amount_cents: number }[] | null) ?? []).reduce((s, d) => s + (d.amount_cents ?? 0), 0)
      const impactTotal =
        ((profileSums.data as { impact_score: number; total_earned_cents: number }[] | null) ?? []).reduce(
          (s, p) => s + (p.impact_score ?? 0),
          0,
        )
      const earnedTotal =
        ((profileSums.data as { impact_score: number; total_earned_cents: number }[] | null) ?? []).reduce(
          (s, p) => s + (p.total_earned_cents ?? 0),
          0,
        )

      setStats({
        totalUsers: usersRes.count ?? 0,
        totalMissions: missionsRes.count ?? 0,
        pendingCompletions: (pendingRes.data as { id: string }[] | null)?.length ?? 0,
        totalDonated,
        totalImpact: impactTotal,
        totalEarned: earnedTotal,
      })

      const rows = ((pendingRes.data as Omit<
        PendingCompletion,
        'mission_title' | 'mission_category' | 'user_name' | 'user_email'
      >[] | null) ?? []).map<PendingCompletion>((r) => ({
        ...r,
        mission_title: null,
        mission_category: null,
        user_name: null,
        user_email: null,
      }))

      if (rows.length > 0) {
        const missionIds = Array.from(new Set(rows.map((r) => r.mission_id)))
        const userIds = Array.from(new Set(rows.map((r) => r.user_id)))

        const [missionsData, usersData] = await Promise.all([
          sb.from('missions').select('id, title, category_id').in('id', missionIds),
          sb.from('profiles').select('id, full_name, email').in('id', userIds),
        ])

        const mMap = new Map(
          ((missionsData.data as { id: string; title: string; category_id: string }[] | null) ?? []).map((m) => [
            m.id,
            m,
          ]),
        )
        const uMap = new Map(
          ((usersData.data as { id: string; full_name: string | null; email: string }[] | null) ?? []).map((u) => [
            u.id,
            u,
          ]),
        )

        rows.forEach((r) => {
          const m = mMap.get(r.mission_id)
          const u = uMap.get(r.user_id)
          r.mission_title = m?.title ?? null
          r.mission_category = m?.category_id ?? null
          r.user_name = u?.full_name ?? null
          r.user_email = u?.email ?? null
        })
      }

      setPending(rows)
      setLoading(false)
    })()
  }, [user, isSuperAdmin])

  const pendingCount = useMemo(() => pending.length, [pending])

  async function review(id: string, action: 'validate' | 'reject') {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/completion/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setPending((prev) => prev.filter((p) => p.id !== id))
      setStats((prev) => (prev ? { ...prev, pendingCompletions: Math.max(0, prev.pendingCompletions - 1) } : prev))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action impossible.')
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl py-12 text-center text-[var(--text-muted)]">Chargement admin…</div>
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState icon="🔒" title="Connecte-toi" description="Accès admin réservé." />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState
          icon="🛡️"
          title="Accès restreint"
          description="Cette page est réservée à l’équipe Sangha. Si c’est une erreur, contacte-nous depuis /contact."
        />
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button variant="secondary">Retour au dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12" data-testid="admin-page">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-transparent to-[#D4AF37]/10 p-6 md:p-8"
      >
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.25),transparent_60%)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Admin Sangha</h1>
            <p className="text-sm text-[var(--text-secondary)]">Console interne — données en temps réel.</p>
          </div>
        </div>
      </motion.header>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={<Users className="h-4 w-4" />}      label="Utilisateurs"    value={(stats?.totalUsers ?? 0).toLocaleString('fr-FR')} />
        <StatCard icon={<Sparkles className="h-4 w-4" />}   label="Missions actives" value={(stats?.totalMissions ?? 0).toLocaleString('fr-FR')} />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="En attente de validation" value={pendingCount.toLocaleString('fr-FR')} accent={pendingCount > 0 ? 'amber' : undefined} />
        <StatCard icon={<HandHeart className="h-4 w-4" />}  label="Dons cumulés"     value={formatPrice(stats?.totalDonated ?? 0)} />
        <StatCard icon={<Heart className="h-4 w-4" />}      label="Impact total"     value={(stats?.totalImpact ?? 0).toLocaleString('fr-FR')} />
        <StatCard icon={<Trophy className="h-4 w-4" />}     label="Wallets cumulés"  value={formatPrice(stats?.totalEarned ?? 0)} />
      </section>

      {/* Pending validations */}
      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-semibold">Validations en attente</h2>
        {pending.length === 0 ? (
          <EmptyState icon="✅" title="Rien à valider" description="L’IA a tout validé automatiquement. Repasse dans quelques heures." />
        ) : (
          <ul className="space-y-3">
            {pending.map((c) => (
              <li key={c.id} className="rounded-3xl border border-white/10 bg-white/5 p-5" data-testid="pending-completion">
                <div className="flex flex-col gap-4 md:flex-row">
                  {c.proof_photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.proof_photo_url}
                      alt="preuve"
                      className="h-40 w-full shrink-0 rounded-2xl border border-white/10 object-cover md:h-32 md:w-40"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--text-primary)]">{c.mission_title ?? 'Mission'}</p>
                      {c.mission_category && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                          {c.mission_category}
                        </span>
                      )}
                      {c.ai_validation_score !== null && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          IA : {Math.round(c.ai_validation_score * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {c.user_name ?? 'Anonyme'} · {c.user_email ?? ''} · {new Date(c.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {c.proof_text && <p className="mt-2 text-sm text-[var(--text-secondary)]">« {c.proof_text} »</p>}
                    {c.proof_gps_lat !== null && c.proof_gps_lng !== null && (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${c.proof_gps_lat}&mlon=${c.proof_gps_lng}#map=16/${c.proof_gps_lat}/${c.proof_gps_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--cyan)] hover:underline"
                      >
                        GPS vérifiable <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        onClick={() => review(c.id, 'validate')}
                        disabled={busyId === c.id}
                        data-testid="validate-btn"
                      >
                        {busyId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<XCircle className="h-4 w-4" />}
                        onClick={() => review(c.id, 'reject')}
                        disabled={busyId === c.id}
                        data-testid="reject-btn"
                      >
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: 'amber'
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent === 'amber' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/5'}`}>
      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-semibold ${accent === 'amber' ? 'text-amber-300' : 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  )
}
