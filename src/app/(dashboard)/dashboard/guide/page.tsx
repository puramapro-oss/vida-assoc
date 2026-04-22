'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  HelpCircle, Sparkles, Compass, Heart, HandHeart, Trophy, Wallet,
  Share2, BookOpen, Shield, MessageCircle, ArrowUpRight, Leaf,
} from 'lucide-react'

interface Step {
  title: string
  body: string
  icon: React.ReactNode
  href?: string
}

const STEPS: Step[] = [
  {
    title: '1. Ton cœur lumineux',
    body: 'Chaque action sur Sangha nourrit ton cœur : missions accomplies, dons, rituels, soutien. Retrouve ton niveau et ton impact sur la page Impact.',
    icon: <Heart className="h-5 w-5 text-pink-300" />,
    href: '/dashboard/impact',
  },
  {
    title: '2. Explore les missions',
    body: 'Plusieurs catégories : dépollution, plantation, aide aux aînés, méditation, soutien scolaire. Filtre par envie, prouve avec une photo, reçois des crédits Sangha ou des euros.',
    icon: <Compass className="h-5 w-5 text-[var(--cyan)]" />,
    href: '/dashboard/missions',
  },
  {
    title: '3. Soutiens les associations',
    body: 'Annuaire vérifié. Un don ponctuel ou mensuel, 100 % sécurisé via Stripe. Ton impact est comptabilisé dans ton Fil de Vie.',
    icon: <HandHeart className="h-5 w-5 text-rose-300" />,
    href: '/dashboard/associations',
  },
  {
    title: '4. Vis les rituels collectifs',
    body: 'Pleine lune, portails énergétiques, rituels de paix… Sangha te guide étape par étape. Plus tu participes, plus ton énergie grandit.',
    icon: <Sparkles className="h-5 w-5 text-[#D4AF37]" />,
    href: '/dashboard/rituels',
  },
  {
    title: '5. Gagne des concours',
    body: '10 gagnants par semaine et par mois, 100 % automatique. Plus tu agis, plus tu as de tickets. Classement hebdo + tirage aléatoire.',
    icon: <Trophy className="h-5 w-5 text-amber-300" />,
    href: '/dashboard/concours',
  },
  {
    title: '6. Ton wallet',
    body: 'Toutes tes récompenses en euros. Retrait IBAN dès 5 €, sans commission. Alimenté par tes missions, parrainages, gains de concours.',
    icon: <Wallet className="h-5 w-5 text-[#D4AF37]" />,
    href: '/dashboard/wallet',
  },
  {
    title: '7. Parraine, et reçois',
    body: 'Un lien unique à partager. 50 % du premier abonnement + 10 % à vie, crédités dans ton wallet ou en crédits Sangha.',
    icon: <Share2 className="h-5 w-5 text-sky-300" />,
    href: '/dashboard/referral',
  },
  {
    title: '8. Apprends à ton rythme',
    body: 'Formations Sangha : gestes concrets, écologie, entraide, bien-être. Gratuit avec Premium.',
    icon: <BookOpen className="h-5 w-5 text-emerald-300" />,
    href: '/dashboard/formations',
  },
]

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Sangha prend-il une commission sur mes retraits ?',
    a: 'Jamais. 100 % de tes gains t’arrivent (retrait SEPA, 2-5 jours ouvrés).',
  },
  {
    q: 'Comment Sangha vérifie mes missions ?',
    a: 'IA + photo + GPS. Une mission ≥ 75 % de confiance est validée automatiquement. Les autres sont revues sous 24 h.',
  },
  {
    q: 'Mes dons vont où ?',
    a: 'Directement à l’association, via Stripe. Sangha prend 0 % sur les dons aux associations partenaires.',
  },
  {
    q: 'Est-ce que Sangha parle toutes les langues ?',
    a: 'Oui — 16 langues activables dans les paramètres.',
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: 'Oui. Hébergement souverain en France, conforme RGPD. Tu peux exporter ou supprimer tes données à tout moment (Paramètres → Zone sensible).',
  },
]

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12" data-testid="guide-page">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--cyan)]/10 via-transparent to-[#D4AF37]/10 p-6 md:p-10"
      >
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.25),transparent_60%)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cyan)]/15 text-[var(--cyan)]">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold">Guide Sangha</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Tout ce qu’il faut pour vivre l’expérience pleinement.</p>
          </div>
        </div>
      </motion.header>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold">Les 8 pas</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {STEPS.map((s) => {
            const content = (
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-[var(--cyan)]/40 hover:bg-white/10">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--text-primary)]">{s.title}</p>
                      {s.href && <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)]" />}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.body}</p>
                  </div>
                </div>
              </div>
            )
            return (
              <li key={s.title}>
                {s.href ? (
                  <Link href={s.href} data-testid={`guide-step-${s.href}`} className="block h-full">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold">Questions fréquentes</h2>
        <div className="rounded-3xl border border-white/10 bg-white/5 divide-y divide-white/5">
          {FAQ.map((f) => (
            <details key={f.q} className="group open:bg-white/[0.02]">
              <summary className="flex cursor-pointer items-center justify-between gap-3 p-5 text-sm font-medium text-[var(--text-primary)] list-none">
                <span>{f.q}</span>
                <span className="text-[var(--text-muted)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Link href="/dashboard/chat-vida" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-[var(--cyan)]/40">
          <MessageCircle className="h-5 w-5 text-[var(--cyan)]" />
          <div>
            <p className="text-sm font-semibold">Demande à Sangha</p>
            <p className="text-xs text-[var(--text-secondary)]">Un expert, 24/7, en français.</p>
          </div>
        </Link>
        <Link href="/aide" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-[var(--cyan)]/40">
          <HelpCircle className="h-5 w-5 text-[#D4AF37]" />
          <div>
            <p className="text-sm font-semibold">Centre d’aide</p>
            <p className="text-xs text-[var(--text-secondary)]">Articles détaillés, recherche fuzzy.</p>
          </div>
        </Link>
        <Link href="/contact" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-[var(--cyan)]/40">
          <Shield className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-sm font-semibold">Contacter l’équipe</p>
            <p className="text-xs text-[var(--text-secondary)]">Réponse sous 48 h.</p>
          </div>
        </Link>
      </section>

      <footer className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[var(--text-secondary)]">
        <Leaf className="h-5 w-5 shrink-0 text-emerald-300" />
        <p>
          Sangha t’accompagne dans ton élévation. Ton rythme est le bon. Commence par une mission douce, écris un mot sur le mur, allume une intention. Le reste vient tout seul.
        </p>
      </footer>
    </div>
  )
}
