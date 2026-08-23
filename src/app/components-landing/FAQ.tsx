'use client'

import ScrollReveal from '@/components/shared/ScrollReveal'
import { StaggerContainer, StaggerItem } from '@/components/shared/Stagger'

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const items = [
    { q: 'Dois-je payer pour utiliser Sangha ?', a: 'Non. Tu peux rejoindre Sangha gratuitement et faire jusqu\'à 3 missions par mois, donner, consulter toutes les associations. Sangha One (3 €/mois) et Sangha Premium (6,90 €/mois) débloquent l\'accès illimité et des récompenses.' },
    { q: 'Comment les missions sont-elles vérifiées ?', a: 'Chaque mission demande une preuve : photo horodatée, métadonnées EXIF, GPS, parfois vidéo. Sangha analyse la preuve et valide. En cas de doute : double confirmation mutuelle ou audit humain.' },
    { q: 'Où va l\'argent de mes dons ?', a: 'Chaque euro est tracé de bout en bout. Les dons aux associations leur sont reversés. Sur Sangha One, 100 % sont redistribués. 50 % des revenus de Sangha sont redistribués mensuellement aux associations et utilisateurs selon leur impact.' },
    { q: 'Puis-je retirer mon argent gagné ?', a: 'Oui. Dès 5 € de solde wallet, tu peux demander un virement IBAN dans Paramètres → Wallet. Traitement sous 3 jours ouvrés.' },
    { q: 'Sangha est-elle accessible aux handicapés ?', a: 'Totalement : modes adaptés handicap visuel, auditif, moteur, enfants, seniors. Voix, contrastes, navigation simplifiée, vibrations, mode multisensoriel désactivable.' },
    { q: 'Que deviennent mes données ?', a: 'RGPD intégral. Tu peux exporter ou supprimer toutes tes données en un clic. Aucune revente. DPO : matiss.frasne@gmail.com.' },
  ]
  return (
    <section id="faq" className="py-20 md:py-32 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-10 md:mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
        </ScrollReveal>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <button
              type="button"
              key={it.q}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full text-left glass rounded-2xl p-5 sm:p-6 hover:border-[#10B981]/30 transition-colors"
              aria-expanded={openIdx === idx}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">{it.q}</span>
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#10B981] text-xl leading-none">
                  <span className={`inline-block transition-transform ${openIdx === idx ? 'rotate-45' : ''}`}>+</span>
                </span>
              </div>
              {openIdx === idx && (
                <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">{it.a}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
