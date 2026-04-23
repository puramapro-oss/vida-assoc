/**
 * URSSAF Tierce Déclaration AUTO-ENTREPRENEUR (TD-AE) — OAuth2.
 * API officielle : https://portailapi.urssaf.fr/fr/catalogue-api/prd/td-ae
 *
 * ⚠️ À ne pas confondre avec "Tiers de Prestation" (services à la personne).
 * TD-AE permet aux plateformes collaboratives de déclarer + payer directement
 * les cotisations URSSAF d'un auto-entrepreneur mandataire.
 *
 * Credentials :
 *  - URSSAF_TD_AE_CLIENT_ID / CLIENT_SECRET (à demander à contact.tiercedeclaration@urssaf.fr)
 *  - URSSAF_TD_AE_BASE_URL (default https://portailapi.urssaf.fr/td-ae)
 *
 * En dev (credentials vides), le module retourne toujours des réponses `mock_draft`
 * sans appel réseau. En prod, OAuth2 client_credentials + endpoints REST.
 */

export interface URSSAFConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
}

export interface Compte {
  siret: string
  nom_prenom: string
  statut: 'actif' | 'suspendu' | 'radie'
  regime: 'micro' | 'reel'
  activite_code: string | null
}

export interface Mandat {
  id: string
  siret: string
  start_date: string
  end_date: string | null
  status: 'pending' | 'active' | 'revoked'
}

export interface EstimationInput {
  siret: string
  period: { type: 'month' | 'quarter'; start: string; end: string }
  amount_cents: number
}

export interface EstimationResult {
  cotisations_cents: number
  impot_cents: number
  total_net_cents: number
  rate_details: { label: string; rate_pct: number; amount_cents: number }[]
}

export interface DeclarationInput extends EstimationInput {
  user_id: string
}

export interface DeclarationResult {
  declaration_id: string | null
  status: 'submitted' | 'draft' | 'rejected'
  submitted_at: string | null
  error: string | null
}

export interface PaiementInput {
  declaration_id: string
  amount_cents: number
  rum: string | null  // Référence Unique Mandat SEPA
}

export interface PaiementResult {
  paiement_id: string | null
  status: 'succeeded' | 'pending' | 'failed'
  error: string | null
}

export function getURSSAFConfig(): URSSAFConfig {
  return {
    clientId: process.env.URSSAF_TD_AE_CLIENT_ID ?? '',
    clientSecret: process.env.URSSAF_TD_AE_CLIENT_SECRET ?? '',
    baseUrl: process.env.URSSAF_TD_AE_BASE_URL ?? 'https://portailapi.urssaf.fr/td-ae',
  }
}

function hasCredentials(cfg: URSSAFConfig): boolean {
  return cfg.clientId.length > 0 && cfg.clientSecret.length > 0
}

// Token cache en mémoire (TTL respecté par l'API URSSAF)
let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(cfg: URSSAFConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token
  const res = await fetch(`${cfg.baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'td-ae' }).toString(),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`URSSAF OAuth2 ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 }
  return json.access_token
}

async function callURSSAF<T>(
  cfg: URSSAFConfig,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const token = await getAccessToken(cfg)
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      return { ok: false, status: res.status, error: errBody.slice(0, 500) }
    }
    return { ok: true, data: (await res.json()) as T }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network error'
    return { ok: false, status: 0, error: msg }
  }
}

/**
 * GET /comptes — liste les comptes auto-entrepreneur associés au mandat plateforme.
 */
export async function getComptes(siret?: string): Promise<{ comptes: Compte[]; mode: 'live' | 'mock_draft' }> {
  const cfg = getURSSAFConfig()
  if (!hasCredentials(cfg)) {
    return { comptes: [], mode: 'mock_draft' }
  }
  const path = siret ? `/comptes?siret=${encodeURIComponent(siret)}` : '/comptes'
  const r = await callURSSAF<{ comptes: Compte[] }>(cfg, 'GET', path)
  if (!r.ok) throw new Error(r.error)
  return { comptes: r.data.comptes ?? [], mode: 'live' }
}

/**
 * POST /mandats — enregistre un mandat auto-entrepreneur → plateforme Purama.
 */
export async function createMandat(input: {
  siret: string
  start_date: string
  rum: string
  ics: string  // Identifiant Créancier SEPA Purama
}): Promise<{ mandat: Mandat | null; mode: 'live' | 'mock_draft'; error?: string }> {
  const cfg = getURSSAFConfig()
  if (!hasCredentials(cfg)) {
    return { mandat: null, mode: 'mock_draft' }
  }
  const r = await callURSSAF<{ mandat: Mandat }>(cfg, 'POST', '/mandats', input)
  if (!r.ok) return { mandat: null, mode: 'live', error: r.error }
  return { mandat: r.data.mandat, mode: 'live' }
}

/**
 * POST /estimer — estime cotisations + IR micro sur un chiffre d'affaires période.
 */
export async function estimerCotisations(input: EstimationInput): Promise<{ estimation: EstimationResult | null; mode: 'live' | 'mock_draft' }> {
  const cfg = getURSSAFConfig()
  if (!hasCredentials(cfg)) {
    // Mock : cotisations micro BNC libéral ~ 21.1 % + versement libératoire IR 2.2 %
    const base = input.amount_cents
    const cotisations = Math.round(base * 0.211)
    const impot = Math.round(base * 0.022)
    return {
      estimation: {
        cotisations_cents: cotisations,
        impot_cents: impot,
        total_net_cents: base - cotisations - impot,
        rate_details: [
          { label: 'Cotisations micro BNC libéral', rate_pct: 21.1, amount_cents: cotisations },
          { label: 'Versement libératoire IR (option)', rate_pct: 2.2, amount_cents: impot },
        ],
      },
      mode: 'mock_draft',
    }
  }
  const r = await callURSSAF<{ estimation: EstimationResult }>(cfg, 'POST', '/estimer', input)
  if (!r.ok) throw new Error(r.error)
  return { estimation: r.data.estimation, mode: 'live' }
}

/**
 * POST /declarer — soumet la déclaration TD-AE pour l'AE mandataire.
 */
export async function declarerCa(input: DeclarationInput): Promise<DeclarationResult & { mode: 'live' | 'mock_draft' }> {
  const cfg = getURSSAFConfig()
  if (!hasCredentials(cfg)) {
    return {
      declaration_id: null,
      status: 'draft',
      submitted_at: null,
      error: 'URSSAF TD-AE credentials not provisioned — declaration kept local (mock_draft)',
      mode: 'mock_draft',
    }
  }
  const r = await callURSSAF<{ declaration: { id: string } }>(cfg, 'POST', '/declarer', input)
  if (!r.ok) {
    return {
      declaration_id: null,
      status: r.status >= 500 ? 'draft' : 'rejected',
      submitted_at: null,
      error: r.error,
      mode: 'live',
    }
  }
  return {
    declaration_id: r.data.declaration.id,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    error: null,
    mode: 'live',
  }
}

/**
 * POST /payer — prélève SEPA sur l'IBAN mandaté et règle URSSAF + impôts.
 */
export async function payerDeclaration(input: PaiementInput): Promise<PaiementResult & { mode: 'live' | 'mock_draft' }> {
  const cfg = getURSSAFConfig()
  if (!hasCredentials(cfg)) {
    return {
      paiement_id: null,
      status: 'pending',
      error: 'URSSAF TD-AE credentials not provisioned — payment queued (mock_draft)',
      mode: 'mock_draft',
    }
  }
  const r = await callURSSAF<{ paiement: { id: string; status: 'succeeded' | 'pending' | 'failed' } }>(cfg, 'POST', '/payer', input)
  if (!r.ok) return { paiement_id: null, status: 'failed', error: r.error, mode: 'live' }
  return { paiement_id: r.data.paiement.id, status: r.data.paiement.status, error: null, mode: 'live' }
}

export const URSSAFService = {
  getComptes,
  createMandat,
  estimerCotisations,
  declarerCa,
  payerDeclaration,
  hasCredentials: () => hasCredentials(getURSSAFConfig()),
}
