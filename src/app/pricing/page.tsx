'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Sparkles, Heart, Leaf } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { PLANS, type PlanId } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  async function handleSelectPlan(planId: PlanId) {
    if (planId === 'free') {
      router.push(user ? '/dashboard' : '/signup')
      return
    }
    if (!user) {
      router.push(`/signup?plan=${planId}&interval=${interval}`)
      return
    }
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, interval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? 'Impossible de démarrer le paiement. Réessaie dans un instant.')
      }
    } catch {
      toast.error('Erreur réseau. Vérifie ta connexion.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [PLANS.free, PLANS.one, PLANS.premium]

  return (
    <div className="relative min-h-screen pb-24 pt-20" data-testid="pricing-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
        </Link>

        {/* Bandeau aides */}
        <Link
          href="/financer"
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 px-6 py-4 text-center hover:bg-[#10B981]/15 transition-colors"
        >
          <Heart className="h-5 w-5 text-[#10B981] shrink-0" />
          <span className="text-sm text-[var(--text-primary)]">
            <strong className="text-[#10B981]">La plupart de nos utilisateurs ne paient rien</strong>{' '}
            grace aux aides publiques.{' '}
            <span className="underline underline-offset-2">Decouvre les tiennes →</span>
          </span>
        </Link>

        <div className="text-center mt-8 mb-12">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold">
            Rejoins Sangha a ton <span className="gradient-text">rythme</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Gratuit pour toujours. Solidaire à 3 €. Complet à 6,90 €.
            <br />14 jours d&apos;essai Premium sans carte bancaire.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              data-testid="interval-monthly"
              className={`rounded-full px-4 py-2 text-sm transition-colors ${interval === 'monthly' ? 'bg-gradient-to-r from-[#10B981] to-[#D4AF37] text-[#04120c] font-semibold' : 'text-[var(--text-secondary)]'}`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setInterval('yearly')}
              data-testid="interval-yearly"
              className={`rounded-full px-4 py-2 text-sm transition-colors ${interval === 'yearly' ? 'bg-gradient-to-r from-[#10B981] to-[#D4AF37] text-[#04120c] font-semibold' : 'text-[var(--text-secondary)]'}`}
            >
              Annuel <span className="text-xs ml-1 opacity-80">−30 %</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isPopular = 'popular' in plan && plan.popular === true
            const priceCents = interval === 'monthly' ? plan.price_monthly : plan.price_yearly
            const monthlyEquiv = interval === 'yearly' && plan.price_yearly > 0
              ? Math.round(plan.price_yearly / 12)
              : null
            return (
              <div
                key={plan.id}
                className={`glass rounded-3xl p-8 relative flex flex-col ${isPopular ? 'border-[#10B981]/50 shadow-[0_20px_80px_-20px_rgba(16,185,129,0.4)]' : ''}`}
                data-testid={`pricing-card-${plan.id}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-4 py-1 text-xs font-semibold text-[#04120c]">
                    ⭐ POPULAIRE
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {plan.id === 'free' && <Leaf className="h-5 w-5 text-[#10B981]" />}
                  {plan.id === 'one' && <Heart className="h-5 w-5 text-[#D4AF37]" />}
                  {plan.id === 'premium' && <Sparkles className="h-5 w-5 text-[#a855f7]" />}
                  <h3 className="text-xl font-semibold">{plan.label}</h3>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold font-[family-name:var(--font-display)]">
                    {priceCents === 0 ? 'Gratuit' : formatPrice(priceCents)}
                  </span>
                  {priceCents > 0 && (
                    <span className="text-[var(--text-muted)] text-sm">
                      {' '}/{interval === 'monthly' ? 'mois' : 'an'}
                    </span>
                  )}
                </div>
                {monthlyEquiv !== null && (
                  <p className="text-xs text-[#D4AF37] mt-1">
                    soit {formatPrice(monthlyEquiv)}/mois
                  </p>
                )}
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="text-[var(--text-secondary)]">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isPopular ? 'primary' : 'secondary'}
                  size="lg"
                  className="mt-8 w-full"
                  loading={loadingPlan === plan.id}
                  onClick={() => handleSelectPlan(plan.id as PlanId)}
                  data-testid={`select-plan-${plan.id}`}
                >
                  {plan.id === 'free' ? 'Commencer gratuitement' : plan.id === 'premium' ? 'Essayer 14j gratuit' : 'Rejoindre Sangha One'}
                </Button>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center text-sm text-[var(--text-muted)]">
          <p>
            SASU PURAMA, 8 Rue de la Chapelle, 25560 Frasne · TVA non applicable, art. 293 B du CGI.
          </p>
          <p className="mt-2">
            Paiements sécurisés via Stripe · 10 % du chiffre d&apos;affaires reversés à l&apos;Association PURAMA.
          </p>
        </div>
      </div>
    </div>
  )
}
