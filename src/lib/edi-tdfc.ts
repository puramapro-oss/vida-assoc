/**
 * EDI-TDFC — Transfert des Données Fiscales et Comptables (impots.gouv.fr).
 * Canal déclaratif officiel pour les entreprises soumises à l'IS (SASU PURAMA, SAS, SARL).
 * Doc : https://www.impots.gouv.fr/professionnel/edi-tdfc
 *
 * Format : fichier EDI-TDFC (structure proprietary XML INSEE, type TDFC-DGFiP).
 * Transport : SFTP chez un Partenaire EDI (Pennylane, Cegid, Dext) OU portail e-flux.
 *
 * ⚠️ Purama n'est PAS Partenaire EDI — on utilise un PEDI tiers (Pennylane recommandé
 * pour les SASU à volume modéré). Ce module prépare le payload, Pennylane transmet.
 */

export interface EDIRecord {
  // En-tête
  siren: string
  period: { year: number; start: string; end: string }
  form_code: 'LIASSE_BIC' | 'LIASSE_BNC' | 'LIASSE_IS' | 'CVAE' | 'CFE'
  // Montants structurants
  chiffre_affaires_cents: number
  charges_cents: number
  resultat_net_cents: number
  // Métadonnées
  form_revision: string        // ex '2026-v1'
  generated_at: string
}

export function buildEDIRecord(input: {
  siren: string
  year: number
  form_code: EDIRecord['form_code']
  chiffre_affaires_cents: number
  charges_cents: number
}): EDIRecord {
  return {
    siren: input.siren,
    period: {
      year: input.year,
      start: `${input.year}-01-01`,
      end: `${input.year}-12-31`,
    },
    form_code: input.form_code,
    chiffre_affaires_cents: input.chiffre_affaires_cents,
    charges_cents: input.charges_cents,
    resultat_net_cents: input.chiffre_affaires_cents - input.charges_cents,
    form_revision: `${input.year}-v1`,
    generated_at: new Date().toISOString(),
  }
}

export function hasEDIPartner(): boolean {
  return !!(process.env.EDI_PARTNER_ID && process.env.EDI_PARTNER_API_KEY)
}
