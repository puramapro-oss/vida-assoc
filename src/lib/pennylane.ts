/**
 * Pennylane API — comptabilité automatisée post-SIREN SASU.
 * Doc : https://pennylane.readme.io/
 *
 * Envoi des factures Factur-X émises par Sangha directement dans le
 * workspace Pennylane SASU PURAMA (journal vente + imputation analytique).
 * Pennylane pousse ensuite vers l'expert-comptable et/ou EDI-TDFC.
 */

export interface PennylaneInvoiceInput {
  external_id: string          // Sangha invoice number (FA-YYYY-NNNNNN)
  customer_name: string
  customer_siret?: string | null
  issue_date: string
  amount_cents: number
  currency: 'EUR'
  description: string
  factur_x_xml?: string | null
  factur_x_pdf_url?: string | null
}

export interface PennylaneResult {
  invoice_id: string | null
  status: 'created' | 'draft' | 'failed'
  error: string | null
}

export async function pushInvoice(input: PennylaneInvoiceInput): Promise<PennylaneResult & { mode: 'live' | 'mock_draft' }> {
  const apiKey = process.env.PENNYLANE_API_KEY
  const workspace = process.env.PENNYLANE_WORKSPACE_ID
  if (!apiKey || !workspace) {
    return { invoice_id: null, status: 'draft', error: 'Pennylane credentials not configured', mode: 'mock_draft' }
  }
  try {
    const res = await fetch(`https://app.pennylane.com/api/external/v1/customer_invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Pennylane-Workspace-Id': workspace,
      },
      body: JSON.stringify({
        external_id: input.external_id,
        customer: { name: input.customer_name, siret: input.customer_siret ?? undefined },
        issue_date: input.issue_date,
        currency: input.currency,
        lines: [
          {
            description: input.description,
            unit_amount_cents: input.amount_cents,
            quantity: 1,
            tax_rate: 0,  // TVA non applicable art.293B
          },
        ],
        attachments: input.factur_x_pdf_url ? [{ url: input.factur_x_pdf_url, kind: 'pdf_factur_x' }] : [],
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => '')
      return { invoice_id: null, status: 'failed', error: `${res.status}: ${err.slice(0, 200)}`, mode: 'live' }
    }
    const json = (await res.json()) as { id: string }
    return { invoice_id: json.id, status: 'created', error: null, mode: 'live' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network error'
    return { invoice_id: null, status: 'failed', error: msg, mode: 'live' }
  }
}

export function hasPennylane(): boolean {
  return !!(process.env.PENNYLANE_API_KEY && process.env.PENNYLANE_WORKSPACE_ID)
}
