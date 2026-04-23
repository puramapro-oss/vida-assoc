/**
 * Bridge API — Open Banking (DSP2) côté users.
 * Doc : https://docs.bridgeapi.io/
 *
 * Permet aux users Sangha de connecter leur banque pour :
 *  - arrondis à l'euro supérieur → dons automatiques aux associations
 *  - catégorisation transactions → Smart Split optimisé
 *  - vérification IBAN avant premier retrait wallet
 *
 * Bridge = agrégateur agréé AISP+PISP (ACPR). Purama n'agrège pas directement.
 */

export interface BridgeConnectSessionInput {
  user_id: string
  email: string
  return_url: string
}

export interface BridgeConnectSession {
  session_id: string
  redirect_url: string
  expires_at: string
}

export async function createConnectSession(
  input: BridgeConnectSessionInput,
): Promise<{ session: BridgeConnectSession | null; mode: 'live' | 'mock_draft'; error?: string }> {
  const clientId = process.env.BRIDGE_CLIENT_ID
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return { session: null, mode: 'mock_draft', error: 'Bridge credentials not configured' }
  }
  try {
    // Bridge : auth user via /v3/aggregation/authorization/token (user-level)
    const authRes = await fetch('https://api.bridgeapi.io/v3/aggregation/authorization/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': clientId,
        'Client-Secret': clientSecret,
      },
      body: JSON.stringify({ email: input.email, external_user_id: input.user_id }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!authRes.ok) {
      const err = await authRes.text().catch(() => '')
      return { session: null, mode: 'live', error: `Bridge auth ${authRes.status}: ${err.slice(0, 200)}` }
    }
    const authJson = (await authRes.json()) as { access_token: string; expires_at: string }

    // Connect session
    const sessionRes = await fetch('https://api.bridgeapi.io/v3/aggregation/connect-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authJson.access_token}`,
      },
      body: JSON.stringify({ return_url: input.return_url }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!sessionRes.ok) {
      const err = await sessionRes.text().catch(() => '')
      return { session: null, mode: 'live', error: `Bridge session ${sessionRes.status}: ${err.slice(0, 200)}` }
    }
    const sessionJson = (await sessionRes.json()) as { id: string; url: string }

    return {
      session: {
        session_id: sessionJson.id,
        redirect_url: sessionJson.url,
        expires_at: authJson.expires_at,
      },
      mode: 'live',
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network error'
    return { session: null, mode: 'live', error: msg }
  }
}

export interface Transaction {
  id: string
  amount_cents: number
  description: string
  date: string
  category: string | null
}

export async function getRecentTransactions(userToken: string, limit = 50): Promise<Transaction[]> {
  const res = await fetch(`https://api.bridgeapi.io/v3/aggregation/transactions?limit=${limit}`, {
    headers: { Authorization: `Bearer ${userToken}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) return []
  const json = (await res.json()) as { resources: { id: string; amount: number; description: string; date: string; category: { name?: string } | null }[] }
  return (json.resources ?? []).map((t) => ({
    id: t.id,
    amount_cents: Math.round(t.amount * 100),
    description: t.description,
    date: t.date,
    category: t.category?.name ?? null,
  }))
}

export function hasBridge(): boolean {
  return !!(process.env.BRIDGE_CLIENT_ID && process.env.BRIDGE_CLIENT_SECRET)
}
