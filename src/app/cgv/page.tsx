import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildCGV } from '@/lib/legal/content/cgv'
import { LEGAL_CONFIG } from '@/lib/legal/config'
import { LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — Sangha',
  description: 'Conditions générales de vente de Sangha (abonnements Sangha One et Sangha Premium).',
}

export default function CGV() {
  const sections = buildCGV(LEGAL_CONFIG)
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.cgv[LEGAL_VERSIONS_HISTORY.cgv.length - 1].date

  return <LegalPage titre="Conditions Générales de Vente" sections={sections} derniereMiseAJour={derniereMiseAJour} />
}
