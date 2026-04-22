/**
 * URSSAF Tierce Déclaration — API Purama tiers déclarant.
 * V7.2 §26 + V4.1 §🧾.
 *
 * Sangha est tiers déclarant URSSAF (mandat user, pas d'agrément).
 * Formats produits :
 *  - TD-Sociale (revenus BNC 305€→77 700€)
 *  - Factur-X (format Chorus Pro, auto-entrepreneur + entreprise)
 *
 * L'API URSSAF réelle est gated par les creds du mandat tiers déclarant.
 * Ce module produit les payloads conformes au schéma, le submit effectif
 * dépend des credentials Purama (ajoutés en env quand habilitation obtenue).
 */

import type { FiscalProfile } from '@/lib/tax-assistant'

export interface TierceDeclarationInput {
  user_id: string
  period_type: 'month' | 'quarter' | 'year'
  period_start: string  // YYYY-MM-DD
  period_end: string
  amount_cents: number
  profile: FiscalProfile
  siret?: string | null
  full_name: string
  address?: { street: string; city: string; postal_code: string; country: string }
  tax_id?: string | null
}

export interface TierceDeclarationPayload {
  declarant: {
    name: string
    siret: string
    mandat_ref: string
  }
  beneficiaire: {
    full_name: string
    siret: string | null
    tax_id: string | null
    profile: FiscalProfile
  }
  periode: {
    type: 'month' | 'quarter' | 'year'
    start: string
    end: string
  }
  montant: {
    brut_cents: number
    currency: 'EUR'
  }
  meta: {
    platform: 'sangha'
    generated_at: string
  }
}

const DECLARANT = {
  name: 'SASU PURAMA',
  siret: '98300000000000', // placeholder — SIRET réel dans env var quand habilitation
  mandat_ref: 'MANDAT-TD-PURAMA-V1',
}

/**
 * Formate un payload conforme URSSAF TD.
 * Aucun appel réseau — simple sérialisation.
 */
export function buildTierceDeclaration(input: TierceDeclarationInput): TierceDeclarationPayload {
  return {
    declarant: {
      name: process.env.URSSAF_DECLARANT_NAME ?? DECLARANT.name,
      siret: process.env.URSSAF_DECLARANT_SIRET ?? DECLARANT.siret,
      mandat_ref: process.env.URSSAF_MANDAT_REF ?? DECLARANT.mandat_ref,
    },
    beneficiaire: {
      full_name: input.full_name,
      siret: input.siret ?? null,
      tax_id: input.tax_id ?? null,
      profile: input.profile,
    },
    periode: {
      type: input.period_type,
      start: input.period_start,
      end: input.period_end,
    },
    montant: {
      brut_cents: input.amount_cents,
      currency: 'EUR',
    },
    meta: {
      platform: 'sangha',
      generated_at: new Date().toISOString(),
    },
  }
}

export interface SubmitResult {
  status: 'submitted' | 'draft' | 'rejected'
  external_ref: string | null
  error: string | null
}

/**
 * Soumet la déclaration à l'URSSAF.
 * Si les creds Purama tiers déclarant ne sont pas configurés,
 * retourne `draft` (conservé en DB, soumission manuelle plus tard).
 */
export async function submitTierceDeclaration(payload: TierceDeclarationPayload): Promise<SubmitResult> {
  const token = process.env.URSSAF_TD_API_TOKEN
  const endpoint = process.env.URSSAF_TD_API_ENDPOINT

  if (!token || !endpoint) {
    return {
      status: 'draft',
      external_ref: null,
      error: 'URSSAF TD credentials not yet provisioned — declaration saved as draft',
    }
  }

  try {
    const res = await fetch(`${endpoint}/v1/declarations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { status: 'rejected', external_ref: null, error: `URSSAF ${res.status}: ${body.slice(0, 200)}` }
    }
    const json = (await res.json().catch(() => null)) as { id?: string } | null
    return { status: 'submitted', external_ref: json?.id ?? null, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    return { status: 'draft', external_ref: null, error: msg }
  }
}
