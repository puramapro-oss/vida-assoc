import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildMentionsLegales } from '@/lib/legal/content/mentions-legales'
import { LEGAL_CONFIG } from '@/lib/legal/config'
import { LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Mentions Légales — Sangha',
  description: 'Mentions légales de Sangha par SASU PURAMA.',
}

export default function MentionsLegales() {
  const sections = buildMentionsLegales(LEGAL_CONFIG)
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.mentions[LEGAL_VERSIONS_HISTORY.mentions.length - 1].date

  return <LegalPage titre="Mentions Légales" sections={sections} derniereMiseAJour={derniereMiseAJour} />
}
