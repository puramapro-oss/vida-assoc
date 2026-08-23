'use client'

import LegalReacceptanceGate from '@/lib/legal/components/LegalReacceptanceGate'
import type { LegalDocType } from '@/lib/legal/types'

/**
 * Câble le gate NIYAMA du socle (bloque l'usage tant qu'une nouvelle version de
 * CGU/CGV/politique n'a pas été ré-acceptée explicitement) dans le layout dashboard.
 * `docsEnAttente` est calculé côté serveur (cf `(dashboard)/layout.tsx`) — ce composant
 * ne fait que déclencher `POST /api/legal/accept` au clic "J'ai lu, je continue".
 * Cf CONFORMITE.md point 4 (codé mais jamais monté).
 */
export default function LegalReacceptanceGateClient({ docsEnAttente }: { docsEnAttente: LegalDocType[] }) {
  if (docsEnAttente.length === 0) return null

  async function handleAccept(docType: LegalDocType) {
    const res = await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType }),
    })
    if (!res.ok) throw new Error('Enregistrement de l’acceptation impossible.')
  }

  return <LegalReacceptanceGate appName="Sangha" docsEnAttente={docsEnAttente} onAccept={handleAccept} />
}
