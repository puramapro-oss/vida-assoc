'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Droplets, TreePine, Users, Heart, Trash2, Trophy, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { formatNumber, formatPrice, levelFromImpactScore } from '@/lib/utils'
import { LEVELS } from '@/lib/constants'
import type { ImpactGlobal, ImpactTracker, MissionCompletion, Mission } from '@/types'

interface PersonalImpact {
  co2_kg: number
  waste_kg: number
  water_l: number
  trees: number
  people_helped: number
  hours: number
}

const ICONS = {
  co2: Leaf,
  waste: Trash2,
  water: Droplets,
  trees: TreePine,
  people: Users,
  hours: Heart,
}

interface CompletionWithMission extends MissionCompletion {
  mission?: Pick<Mission, 'title' | 'category_id'> | null
}

export default function ImpactPage() {
  const { profile, loading: authLoading } = useAuth()
  const [global, setGlobal] = useState<ImpactGlobal | null>(null)
  const [personal, setPersonal] = useState<PersonalImpact>({
    co2_kg: 0,
    waste_kg: 0,
    water_l: 0,
    trees: 0,
    people_helped: 0,
    hours: 0,
  })
  const [timeline, setTimeline] = useState<CompletionWithMission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    const sb = createClient()
    ;(async () => {
      const globalQuery = sb.from('impact_global').select('*').order('date', { ascending: false }).limit(1).maybeSingle()
      const trackerQuery = profile?.id
        ? sb.from('impact_tracker').select('*').eq('user_id', profile.id)
        : null
      const timelineQuery = profile?.id
        ? sb
            .from('mission_completions')
            .select('*, mission:missions(title, category_id)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(20)
        : null

      const [globalRes, trackerRes, timelineRes] = await Promise.all([
        globalQuery,
        trackerQuery,
        timelineQuery,
      ])

      setGlobal((globalRes.data as ImpactGlobal | null) ?? null)
      if (trackerRes) {
        const trackers = (trackerRes.data as ImpactTracker[] | null) ?? []
        const sums: PersonalImpact = {
          co2_kg: 0, waste_kg: 0, water_l: 0, trees: 0, people_helped: 0, hours: 0,
        }
        for (const t of trackers) {
          if (t.impact_type === 'co2_saved_kg') sums.co2_kg += Number(t.impact_value)
          if (t.impact_type === 'waste_collected_kg') sums.waste_kg += Number(t.impact_value)
          if (t.impact_type === 'water_protected_l') sums.water_l += Number(t.impact_value)
          if (t.impact_type === 'trees_planted') sums.trees += Number(t.impact_value)
          if (t.impact_type === 'people_helped') sums.people_helped += Number(t.impact_value)
          if (t.impact_type === 'hours_volunteered') sums.hours += Number(t.impact_value)
        }
        setPersonal(sums)
      }
      if (timelineRes) {
        setTimeline((timelineRes.data as CompletionWithMission[] | null) ?? [])
      }
      setLoading(false)
    })()
  }, [profile?.id, authLoading])

  const level = levelFromImpactScore(profile?.impact_score ?? 0)
  const nextLevelIdx = LEVELS.findIndex((l) => l.id === level.id)
  const nextLevel = LEVELS[nextLevelIdx + 1]

  if (loading || authLoading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Lecture de ton impact…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="impact-page">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
          Ton <span className="text-[#10B981]">impact</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Chaque mission, chaque don, chaque geste — tracé pour toujours.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#10B981]/20 bg-gradient-to-br from-[#10B981]/10 via-white/[0.02] to-[#D4AF37]/5 p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Niveau de conscience</p>
            <p className="mt-1 text-3xl font-[family-name:var(--font-display)] font-bold">
              <span aria-hidden>{level.emoji}</span> {level.name}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Score impact : <span className="text-[#D4AF37] font-semibold">{formatNumber(profile?.impact_score ?? 0)}</span>
            </p>
          </div>
          <div className="text-right">
            <Trophy className="h-8 w-8 text-[#D4AF37] inline" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {profile?.total_missions_completed ?? 0} missions terminées
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#10B981] to-[#D4AF37]" style={{ width: `${level.progress * 100}%` }} />
        </div>
        {nextLevel ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Plus que {Math.round((1 - level.progress) * 100)} % avant le niveau{' '}
            <span className="text-[var(--text-primary)] font-semibold">{nextLevel.name}</span> {nextLevel.emoji}
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#D4AF37]">Tu as atteint le sommet de la conscience Sangha ✨</p>
        )}
      </motion.section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-semibold">Impact mesuré</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ImpactCard icon={ICONS.co2} value={`${formatNumber(personal.co2_kg)} kg`} label="CO₂ évité" color="#10B981" />
          <ImpactCard icon={ICONS.waste} value={`${formatNumber(personal.waste_kg)} kg`} label="Déchets" color="#84cc16" />
          <ImpactCard icon={ICONS.water} value={`${formatNumber(personal.water_l)} L`} label="Eau" color="#06b6d4" />
          <ImpactCard icon={ICONS.trees} value={formatNumber(personal.trees)} label="Arbres" color="#22c55e" />
          <ImpactCard icon={ICONS.people} value={formatNumber(personal.people_helped)} label="Personnes" color="#a855f7" />
          <ImpactCard icon={ICONS.hours} value={`${formatNumber(personal.hours)} h`} label="Bénévolat" color="#D4AF37" />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" /> Impact mondial Sangha (aujourd&apos;hui)
          </h2>
        </div>
        {global ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <GlobalStat label="Missions" value={formatNumber(global.total_missions)} />
            <GlobalStat label="CO₂ évité" value={`${formatNumber(global.total_co2_kg)} kg`} />
            <GlobalStat label="Personnes aidées" value={formatNumber(global.total_people_helped)} />
            <GlobalStat label="Reversés" value={formatPrice(global.total_donated_cents)} />
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Statistiques en cours de calcul…</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-semibold">Fil de Vie</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Ton fil démarre quand tu valides ta première mission. Il restera gravé pour toujours.
          </p>
        ) : (
          <ol className="relative border-l border-white/10 pl-5 space-y-4">
            {timeline.map((c) => (
              <li key={c.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-[#10B981] bg-[var(--background)]" />
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm text-[var(--text-primary)] font-medium">{c.mission?.title ?? 'Mission validée'}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {c.status === 'validated' ? '✅ Validée' : c.status === 'pending' ? '⏳ En attente Sangha' : c.status === 'rejected' ? '❌ À retenter' : '⚖️ Litige'}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function ImpactCard({ icon: Icon, value, label, color }: { icon: typeof Leaf; value: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <Icon className="mx-auto h-5 w-5" style={{ color }} />
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function GlobalStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-base font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
