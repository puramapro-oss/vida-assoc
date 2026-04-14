'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BadgeCheck, Globe, MapPin, ArrowRight, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatPrice, formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Association, Mission } from '@/types'

export default function AssociationDetailPage() {
  const params = useParams<{ slug: string }>()
  const [association, setAssociation] = useState<Association | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.slug) return
    const sb = createClient()
    ;(async () => {
      const { data: a } = await sb.from('associations').select('*').eq('slug', params.slug).maybeSingle()
      setAssociation((a as Association | null) ?? null)
      if (a) {
        const { data: m } = await sb
          .from('missions')
          .select('*')
          .eq('association_id', (a as Association).id)
          .eq('status', 'active')
          .limit(20)
        setMissions((m as Mission[] | null) ?? [])
      }
      setLoading(false)
    })()
  }, [params?.slug])

  if (loading) {
    return <div className="mx-auto max-w-3xl py-12 text-center text-[var(--text-muted)]">Chargement de l&apos;association…</div>
  }
  if (!association) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-[var(--text-secondary)]">Cette association n&apos;est pas reconnue.</p>
        <Link href="/dashboard/associations" className="mt-4 inline-block text-[#10B981] underline">
          Retour à l&apos;annuaire
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10" data-testid="asso-detail">
      <Link href="/dashboard/associations" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[#10B981]">
        <ArrowLeft className="h-4 w-4" /> Toutes les associations
      </Link>

      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
            {association.name}
          </h1>
          {association.verified && <BadgeCheck className="h-6 w-6 text-[#10B981]" aria-label="Vérifiée" />}
        </div>
        {association.mission_statement && (
          <p className="text-lg text-[#D4AF37] italic">« {association.mission_statement} »</p>
        )}
        <p className="text-[var(--text-secondary)] leading-relaxed">{association.description}</p>

        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
          {association.country && (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" /> {association.country}
            </span>
          )}
          {association.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {association.city}
            </span>
          )}
          {association.category && <span className="rounded-full bg-white/5 px-2 py-0.5 uppercase">{association.category}</span>}
        </div>
      </motion.header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Missions" value={formatNumber(association.missions_count)} color="#10B981" />
        <Stat label="Bénévoles" value={formatNumber(association.volunteers_count)} color="#a855f7" />
        <Stat label="Dons reçus" value={formatPrice(association.donations_received_cents)} color="#D4AF37" />
      </section>

      <section className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-[#10B981]/5 p-5 text-center">
        <Heart className="mx-auto h-8 w-8 text-[#D4AF37]" />
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold">Soutenir {association.name}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">100 % de ton don part à l&apos;association — VIDA prend 0 %.</p>
        <Link href={`/dashboard/dons?asso=${association.slug}`}>
          <Button className="mt-4">Faire un don</Button>
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Missions ouvertes</h2>
          {missions.length > 0 && (
            <Link href="/dashboard/missions" className="text-xs text-[#10B981] hover:underline">
              Toutes
            </Link>
          )}
        </div>
        {missions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Aucune mission ouverte pour le moment — reviens plus tard.</p>
        ) : (
          <div className="space-y-2">
            {missions.map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/missions/${m.id}`}
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:border-[#10B981]/40"
              >
                <div>
                  <p className="font-semibold text-[var(--text-primary)] group-hover:text-[#10B981]">{m.title}</p>
                  <p className="line-clamp-1 text-xs text-[var(--text-secondary)]">{m.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[#10B981]" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {association.website && (
        <a
          href={association.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[#10B981] hover:underline"
        >
          Site officiel <ArrowRight className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
