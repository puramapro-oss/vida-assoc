import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildCGU } from '@/lib/legal/content/cgu'
import { LEGAL_CONFIG } from '@/lib/legal/config'
import { LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Conditions Générales d’Utilisation — Sangha',
  description: 'Conditions générales d’utilisation de Sangha.',
}

export default function CGU() {
  const sections = buildCGU(LEGAL_CONFIG)
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.cgu[LEGAL_VERSIONS_HISTORY.cgu.length - 1].date

  return <LegalPage titre="Conditions Générales d'Utilisation" sections={sections} derniereMiseAJour={derniereMiseAJour} />
}
