'use client'

import { Check, Zap } from 'lucide-react'
import ScrollReveal from '@/components/shared/ScrollReveal'


// ─── Pricing ─────────────────────────────────────────────────────────────────
export function Pricing() {
  const plans = [
    {
      id: 'free',
      name: 'Découverte',
      price: '0 €',
      period: 'pour toujours',
      desc: 'Pour découvrir Sangha sans engagement',
      features: [
        'Accès lecture complet',
        '3 missions gratuites / mois',
        '1 don ponctuel / mois',
        'Compteur impact personnel',
        'Feed quotidien',
      ],
      cta: 'Commencer gratuitement',
      href: '/signup',
    },
    {
      id: 'one',
      name: 'Sangha One',
      price: '3 €',
      period: '/ mois',
      desc: 'L\'abonnement solidaire — 100 % reversés',
      features: [
        '100 % destiné aux associations',
        'Missions illimitées',
        'Don automatique chaque mois',
        'Concours hebdo inclus',
        'Badge cœur lumineux',
      ],
      cta: 'Rejoindre Sangha One',
      href: '/signup?plan=one',
    },
    {
      id: 'premium',
      name: 'Sangha Premium',
      price: '6,90 €',
      period: '/ mois',
      desc: 'Tout Sangha. Récompenses x5.',
      features: [
        'Tout Sangha One inclus',
        'Missions rémunérées illimitées',
        'Rituels collectifs inclus',
        'x5 places concours',
        'Assistant Sangha illimité',
        'Formations premium',
        'Cashback 5 % marketplace',
        'Retrait IBAN dès 5 €',
      ],
      cta: 'Essayer 14j gratuit',
      href: '/signup?plan=premium',
      popular: true,
    },
  ]
  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Des <span className="gradient-text">prix honnêtes</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)]">
            -30 % en annuel • 14 jours d&apos;essai gratuit • Pause à vie possible
          </p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {plans.map((plan) => (
            <StaggerItem
              key={plan.id}
              className={`glass rounded-3xl p-6 sm:p-8 relative ${plan.popular ? 'border-[#10B981]/50 shadow-[0_20px_80px_-20px_rgba(16,185,129,0.4)]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-4 py-1 text-xs font-semibold text-[#04120c] whitespace-nowrap">
                  ⭐ POPULAIRE
                </div>
              )}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-display)]">{plan.price}</span>
                <span className="text-[var(--text-muted)]">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{plan.desc}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="text-[var(--text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                data-testid={`pricing-cta-${plan.id}`}
                className={`mt-8 block w-full rounded-xl text-center px-4 py-3 font-medium transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#10B981] to-[#D4AF37] text-[#04120c] hover:opacity-90'
                    : 'border border-white/10 bg-white/5 text-[var(--text-primary)] hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
