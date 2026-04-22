/**
 * Purama Tax Assistant — 4 profils auto-détectés.
 * V4.1 §🧾 — Détection au onboarding Connect, escalade selon cumul annuel.
 */

export type FiscalProfile = 'particulier_occ' | 'bnc' | 'autoentrepreneur' | 'entreprise'

export interface FiscalContext {
  cumul_annual_cents: number
  has_siret: boolean
  current_profile: FiscalProfile | null
}

/**
 * Auto-détection du profil fiscal basée sur le cumul annuel + SIRET.
 * Seuils (euros → cents) :
 *  - <305€/an sans SIRET → particulier occasionnel (non imposable, pas de déclaration)
 *  - 305€ à 77 700€/an sans SIRET → BNC (déclaration contrôlée URSSAF TD)
 *  - SIRET + régime micro → autoentrepreneur
 *  - SIRET + société → entreprise
 */
export function detectProfile(ctx: FiscalContext): FiscalProfile {
  if (ctx.has_siret) {
    if (ctx.current_profile === 'entreprise') return 'entreprise'
    return 'autoentrepreneur'
  }
  if (ctx.cumul_annual_cents < 30500) return 'particulier_occ'
  if (ctx.cumul_annual_cents < 7770000) return 'bnc'
  // Au-delà de 77 700€ sans SIRET : forcer escalade entreprise
  return 'entreprise'
}

export interface RetraitMessage {
  headline: string
  body: string
  action_required: 'none' | 'siret' | 'declaration' | 'expert_comptable'
}

/**
 * Message retrait contextualisé au profil fiscal.
 * V4.1 §🧾 — jamais de jargon fiscal agressif, tutoiement empathique.
 */
export function getRetraitMessage(profile: FiscalProfile, cumul_cents: number): RetraitMessage {
  const cumul = (cumul_cents / 100).toFixed(2)
  switch (profile) {
    case 'particulier_occ':
      return {
        headline: '✅ Retrait autorisé — aucune démarche fiscale',
        body: `Tu as gagné ${cumul}€ cette année. En dessous de 305€ annuels, l'État considère ça comme un revenu occasionnel non imposable. Rien à déclarer.`,
        action_required: 'none',
      }
    case 'bnc':
      return {
        headline: '📋 Sangha déclare pour toi à l\'URSSAF',
        body: `Tu as cumulé ${cumul}€ cette année. Au-dessus de 305€ annuels, l'URSSAF est notifiée via la Tierce Déclaration (on s'en occupe). Tu recevras ton Factur-X PDF automatiquement — zéro paperasse.`,
        action_required: 'declaration',
      }
    case 'autoentrepreneur':
      return {
        headline: '🧾 Facture auto-entrepreneur générée',
        body: `${cumul}€ cumulés — ta facture Factur-X (PDF + XML) est prête à télécharger. Déclare-la sur ton espace autoentrepreneur.urssaf.fr dans les 30 jours.`,
        action_required: 'declaration',
      }
    case 'entreprise':
      return {
        headline: '🏢 Facture entreprise prête',
        body: `${cumul}€ cumulés — ta facture Factur-X (PDF + XML au format Chorus Pro) est générée. Transmets-la à ton expert-comptable pour intégration.`,
        action_required: 'expert_comptable',
      }
  }
}

/**
 * Règle d'escalade : si le cumul dépasse un seuil, on suggère au user
 * d'upgrade son profil (demander SIRET).
 */
export function shouldEscalate(profile: FiscalProfile, cumul_cents: number): boolean {
  if (profile === 'particulier_occ' && cumul_cents >= 30500) return true
  if (profile === 'bnc' && cumul_cents >= 3000000) return true // 30 000€
  return false
}

export function formatProfileLabel(profile: FiscalProfile): string {
  switch (profile) {
    case 'particulier_occ':
      return 'Particulier occasionnel'
    case 'bnc':
      return 'BNC (Bénéfices Non Commerciaux)'
    case 'autoentrepreneur':
      return 'Auto-entrepreneur'
    case 'entreprise':
      return 'Entreprise (SASU/SAS/SARL)'
  }
}
