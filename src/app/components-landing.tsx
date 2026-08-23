'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight, Check, Globe, HandHeart, Sparkles, Heart, Users, Trophy,
  BookOpen, ShoppingBag, Shield, Leaf, PlayCircle, Menu, X, Zap, Quote,
} from 'lucide-react'
import ScrollReveal from '@/components/shared/ScrollReveal'
import { StaggerContainer, StaggerItem } from '@/components/shared/Stagger'

// ─── Nav ─────────────────────────────────────────────────────────────────────
export { Nav } from './components-landing/Nav'
export { Hero } from './components-landing/Hero'
export { Pricing } from './components-landing/Pricing'
export { AssociationsList } from './components-landing/AssociationsList'
export { FAQ } from './components-landing/FAQ'
export { Footer } from './components-landing/Footer'

export function Stats() {
  const pillars = [
    { value: '100 %', label: 'Don Sangha One', desc: 'Reversé intégralement aux associations' },
    { value: '50 %', label: 'Redistribué', desc: 'Des revenus aux associations + utilisateurs' },
    { value: '0 €', label: 'Pour démarrer', desc: 'Inscription gratuite, sans carte' },
    { value: '5 €', label: 'Retrait IBAN', desc: 'Seuil minimum, virement sous 3 jours' },
  ]
  return (
    <section className="py-16 border-y border-white/[0.06] bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8" staggerDelay={0.08}>
          {pillars.map((s) => (
            <StaggerItem key={s.label} className="text-center">
              <div className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">{s.value}</div>
              <div className="mt-2 text-xs sm:text-sm text-[var(--text-primary)] font-medium">{s.label}</div>
              <div className="mt-1 text-[11px] sm:text-xs text-[var(--text-muted)] leading-snug">{s.desc}</div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────────────────────
export function Features() {
  const features = [
    { icon: Globe, title: 'Missions partout', desc: 'Ramasser des déchets, aider une personne âgée, partager une méditation. Preuve photo, GPS ou validée par Sangha.' },
    { icon: HandHeart, title: 'Dons tracés', desc: 'Chaque euro suivi jusqu\'à son usage final. Arrondissement, dons récurrents, dons matériels.' },
    { icon: Sparkles, title: 'Rituels collectifs', desc: 'Méditations simultanées chaque semaine. Paix, gratitude, dépollution, soin collectif.' },
    { icon: Heart, title: 'Impact réel', desc: 'Compteur kg CO₂, arbres plantés, repas distribués, heures bénévoles. Affichage personnel et global.' },
    { icon: Users, title: 'Associations vérifiées', desc: 'Chaque association rejoint Sangha après vérification. Transparence sur leurs missions et leurs dons reçus.' },
    { icon: Trophy, title: 'Concours hebdo', desc: '10 gagnants chaque semaine. Abonnés Premium : 5x plus de places.' },
    { icon: BookOpen, title: 'Formations Sangha', desc: 'Gratuites pour les personnes dans le besoin. Adaptées aux handicaps visuels, auditifs, moteurs.' },
    { icon: ShoppingBag, title: 'Marketplace solidaire', desc: 'Bracelets, purificateurs d\'eau, formations, livres inspirants. Cashback Sangha pour les abonnés.' },
    { icon: Shield, title: '100 % conforme', desc: 'RGPD, App Store, Play Store. Anti-fraude IA. Chiffrement, export, suppression à tout moment.' },
  ] as const
  return (
    <section id="missions" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Une plateforme, <span className="gradient-text">infinies actions</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Tout ce qu&apos;il faut pour rejoindre un mouvement positif, agir concrètement, être récompensé.
          </p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" staggerDelay={0.06}>
          {features.map(({ icon: Icon, title, desc }) => (
            <StaggerItem key={title} className="glass rounded-2xl p-6 hover:border-[#10B981]/30 transition-colors">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── How It Works ────────────────────────────────────────────────────────────
export function HowItWorks() {
  const steps = [
    { num: '1', title: 'Tu t\'inscris', desc: '100 crédits Sangha offerts + 1 ticket concours. En 30 secondes.', icon: Leaf },
    { num: '2', title: 'Tu choisis une mission', desc: 'Près de chez toi, qui te correspond. Sangha te propose les meilleures selon ton profil.', icon: Globe },
    { num: '3', title: 'Tu agis et prouves', desc: 'Photo, GPS, validation Sangha. 10 secondes suffisent pour prouver ton action.', icon: Heart },
    { num: '4', title: 'Tu es récompensé', desc: 'Crédits Sangha, places concours, argent réel. Dès 5 €, retrait IBAN.', icon: Trophy },
  ]
  return (
    <section id="impact" className="py-20 md:py-32 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Comment ça <span className="gradient-text">marche</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)]">4 étapes. Zéro friction.</p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6" staggerDelay={0.08}>
          {steps.map(({ num, title, desc, icon: Icon }) => (
            <StaggerItem key={num} className="relative">
              <div className="glass rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-[family-name:var(--font-display)] font-bold text-[#10B981]">{num}</span>
                  <Icon className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────────────
export function Promise() {
  return (
    <section className="py-20 md:py-32">
      <ScrollReveal className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <Quote className="mx-auto h-10 w-10 text-[#D4AF37] mb-6" />
        <p className="font-[family-name:var(--font-display)] text-xl sm:text-2xl md:text-3xl font-semibold leading-relaxed text-[var(--text-primary)]">
          « La plateforme où chaque don, chaque mission, chaque action positive est
          récompensée, tracée et multipliée. Toutes les associations qui nous rejoignent,
          unies sous un seul cœur. »
        </p>
        <div className="mt-6 text-sm text-[var(--text-muted)]">Tissma, fondateur PURAMA — Frasne, 25560</div>
      </ScrollReveal>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export function FinalCTA() {
  return (
    <section className="py-20 md:py-32">
      <ScrollReveal className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#10B981]/30 bg-gradient-to-br from-[#10B981]/10 via-transparent to-[#D4AF37]/10 p-8 sm:p-12 md:p-16 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-[#10B981]/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />
          </div>
          <div className="relative">
            <Zap className="mx-auto h-10 w-10 text-[#D4AF37] mb-4" />
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
              Prêt à <span className="gradient-text">agir</span> ?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
              Rejoins Sangha gratuitement. Ta première mission t&apos;attend déjà.
              100 crédits et un ticket concours offerts.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                data-testid="final-cta-signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-8 py-4 text-base font-semibold text-[#04120c] shadow-lg hover:shadow-xl transition-all"
              >
                Rejoindre Sangha <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/aide"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base text-[var(--text-primary)] hover:bg-white/10 transition-all"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
