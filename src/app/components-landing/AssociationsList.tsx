'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/shared/ScrollReveal'
import { StaggerContainer, StaggerItem } from '@/components/shared/Stagger'

export function AssociationsList() {
  const themes = [
    { emoji: '🌍', label: 'Environnement', desc: 'Dépollution, reforestation, protection animale' },
    { emoji: '🤝', label: 'Humanitaire', desc: 'Aide alimentaire, sans-abri, urgence' },
    { emoji: '🩺', label: 'Santé', desc: 'Soin, prévention, accompagnement' },
    { emoji: '🧒', label: 'Enfance', desc: 'Éducation, protection, jeux' },
    { emoji: '👵', label: 'Seniors', desc: 'Compagnie, courses, lien social' },
    { emoji: '♿', label: 'Handicap', desc: 'Accessibilité, accompagnement, transport' },
    { emoji: '⚖️', label: 'Droits', desc: 'Justice, plaidoyer, défense' },
    { emoji: '🐾', label: 'Animaux', desc: 'Refuge, protection, adoption' },
  ]
  return (
    <section id="associations" className="py-20 md:py-32 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Toutes les causes, <span className="gradient-text">un seul cœur</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Chaque association vérifiée rejoint Sangha gratuitement. Inscris la tienne ou
            soutiens celles qui agissent déjà — par thème, par pays, près de chez toi.
          </p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" staggerDelay={0.04}>
          {themes.map((t) => (
            <StaggerItem key={t.label} className="glass rounded-2xl p-4 sm:p-5 flex items-start gap-3 hover:border-[#10B981]/30 transition-colors">
              <span className="text-2xl sm:text-3xl shrink-0" aria-hidden>{t.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{t.label}</div>
                <div className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-snug">{t.desc}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/associations"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-all"
          >
            Découvrir les associations <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm text-[#10B981] hover:text-[#D4AF37] transition-colors"
          >
            Inscrire mon association
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Promise ─────────────────────────────────────────────────────────────────
