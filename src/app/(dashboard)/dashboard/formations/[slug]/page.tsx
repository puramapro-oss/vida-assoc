'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { Formation } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function FormationDetailPage({ params }: PageProps) {
  const { slug } = use(params)
  const { user } = useAuth()
  const [formation, setFormation] = useState<Formation | null>(null)
  const [percent, setPercent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const { data } = await sb.from('formations').select('*').eq('slug', slug).maybeSingle()
      const f = data as Formation | null
      setFormation(f)
      if (f && user) {
        const { data: prog } = await sb
          .from('formation_progress')
          .select('percent_complete')
          .eq('user_id', user.id)
          .eq('formation_id', f.id)
          .maybeSingle()
        if (prog) setPercent((prog as { percent_complete: number }).percent_complete)
      }
      setLoading(false)
    })()
  }, [slug, user])

  async function updateProgress(value: number) {
    if (!user || !formation) return
    setSaving(true)
    const sb = createClient()
    await sb
      .from('formation_progress')
      .upsert(
        {
          user_id: user.id,
          formation_id: formation.id,
          percent_complete: value,
          ...(value >= 100 ? { completed_at: new Date().toISOString() } : {}),
        },
        { onConflict: 'user_id,formation_id' },
      )
    setPercent(value)
    setSaving(false)
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl py-12 text-center text-[var(--text-muted)]">Chargement…</div>
  }

  if (!formation) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState icon="📚" title="Formation introuvable" description="Elle a peut-être été retirée du catalogue." />
        <div className="mt-4 text-center">
          <Link href="/dashboard/formations" className="text-sm text-[var(--cyan)] hover:underline">Retour au catalogue</Link>
        </div>
      </div>
    )
  }

  const modules = formation.modules ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10" data-testid="formation-detail">
      <Link href="/dashboard/formations" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <ArrowLeft className="h-3 w-3" /> Toutes les formations
      </Link>

      <header className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        {formation.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={formation.thumbnail_url} alt="" className="h-56 w-full object-cover" />
        )}
        <div className="p-6">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{formation.type}</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
            {formation.title}
          </h1>
          {formation.description && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{formation.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            {formation.duration_minutes && (
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formation.duration_minutes} min</span>
            )}
            <span className="rounded-full bg-white/5 px-2 py-0.5">{formation.target_audience}</span>
          </div>
        </div>
      </header>

      {percent > 0 && percent < 100 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-[var(--text-muted)]">Progression</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--green)]" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{percent}% complété</p>
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cyan)]" /> Contenu
        </h2>
        {modules.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Le contenu de cette formation est en préparation. Reviens bientôt — tu seras notifié·e dès qu’elle sera disponible.
          </p>
        ) : (
          <ol className="space-y-2">
            {modules.map((m, i) => {
              const reached = percent >= ((i + 1) / modules.length) * 100
              return (
                <li
                  key={m.id ?? i}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm"
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${reached ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                    {reached ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="flex-1 text-[var(--text-primary)]">{m.title}</span>
                  <span className="text-xs text-[var(--text-muted)]">{m.duration} min</span>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {user && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => updateProgress(Math.min(100, percent + 25))}
            disabled={saving || percent >= 100}
          >
            +25 % de progression
          </Button>
          {percent < 100 ? (
            <Button onClick={() => updateProgress(100)} disabled={saving}>
              Marquer comme terminée
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-[var(--green)]">
              <CheckCircle2 className="h-4 w-4" /> Terminée — bravo !
            </span>
          )}
        </div>
      )}
    </div>
  )
}
