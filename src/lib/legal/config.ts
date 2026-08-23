import type { LegalAppConfig } from './types'
import { buildCompanyInfo, buildMediateurInfo } from './company'

/**
 * Config NIYAMA de Sangha (vida_assoc) — famille karma_wellness (missions/dons récompensés
 * par crédits + parrainage), paiement réel (Stripe, plans One/Premium), chat IA réel
 * (Claude via /api/chat-vida). cf packages/legal/README.md pour le sens de chaque champ.
 */
export const LEGAL_CONFIG: LegalAppConfig = {
  slug: 'vida_assoc',
  nom: 'Sangha',
  domaine: 'vida-assoc.purama.dev',
  famille: 'karma_wellness',
  company: buildCompanyInfo(),
  mediateur: buildMediateurInfo(),
  descriptionActivite:
    "Sangha connecte les associations et leurs membres autour de missions solidaires, dons et rituels d'impact : chaque action positive est tracée, récompensée en crédits et multipliée via un fonds mensuel reversé aux associations partenaires.",
  aPaiement: true,
  aChatIA: true,
}
