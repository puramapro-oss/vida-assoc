import Link from 'next/link'
import { Shield, FileText, Users, Check } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Fiscalité — Zéro paperasse | ${APP_NAME}`,
  description: `${APP_NAME} te fournit un Factur-X conforme pour chaque versement. 4 profils fiscaux auto-détectés (occ/BNC/AE/entreprise).`,
}

export default function FiscalPublicPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-400">
          <Shield className="h-3 w-3" />
          100% légal — Factur-X conforme Chorus Pro
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] leading-tight">
          Tu gagnes. <span className="gradient-text">On te fournit Factur-X.</span>
        </h1>
        <p className="mt-5 text-lg text-[var(--text-secondary)] max-w-2xl">
          {APP_NAME} te fournit automatiquement le bon format de facture pour déclarer sereinement. 4 profils détectés automatiquement à
          l&apos;onboarding : particulier occasionnel, BNC, auto-entrepreneur, entreprise.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <Profile
            title="Particulier occasionnel"
            threshold="< 305€ / an"
            desc="Revenus occasionnels non imposables. Rien à déclarer. On te remet ton récapitulatif."
          />
          <Profile
            title="BNC (Bénéfices Non Commerciaux)"
            threshold="305€ à 77 700€ / an"
            desc="Factur-X PDF+XML auto. Tu déclares en BNC (case 5NP) sur impots.gouv.fr."
          />
          <Profile
            title="Auto-entrepreneur"
            threshold="SIRET + régime micro"
            desc="Factur-X à ton nom (PDF+XML). Déclare sur autoentrepreneur.urssaf.fr en 1 clic."
          />
          <Profile
            title="Entreprise (SASU/SAS/SARL)"
            threshold="SIRET + société"
            desc="Factur-X format Chorus Pro, intégrable directement par ton expert-comptable."
          />
        </div>

        <div className="mt-12 glass rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Comment ça marche</h2>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> Tu rejoins Sangha + onboarding Stripe Connect Express en 3 min</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> Ton profil fiscal est détecté automatiquement</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> Tu agis — missions, parrainage, dons. L&apos;argent arrive sur ton wallet</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> Sangha déclare, génère ton Factur-X, envoie à l&apos;URSSAF si besoin</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> Retrait IBAN dès 5€ — 30 jours de délai anti-fraude à l&apos;inscription</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-6 py-3 text-sm font-medium text-center"
          >
            Activer mon espace fiscal
          </Link>
          <Link
            href="/aide"
            className="rounded-xl border border-white/10 text-[var(--text-secondary)] px-6 py-3 text-sm font-medium text-center hover:border-white/20"
          >
            Poser une question
          </Link>
        </div>

        <p className="mt-12 text-xs text-[var(--text-muted)] inline-flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Cadre : Stripe Technology Europe Limited (STEL) — licence EMI passportée FR via PSD2 — validée ACPR.
        </p>
      </section>
    </main>
  )
}

function Profile({ title, threshold, desc }: { title: string; threshold: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs text-cyan-400 uppercase tracking-wider">{threshold}</div>
      <h3 className="mt-1 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{desc}</p>
    </div>
  )
}
