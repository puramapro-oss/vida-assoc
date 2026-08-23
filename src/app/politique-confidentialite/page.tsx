import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildPolitiqueConfidentialite } from '@/lib/legal/content/politique-confidentialite'
import { LEGAL_CONFIG } from '@/lib/legal/config'
import { LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — Sangha',
  description: 'Politique de confidentialité et protection des données personnelles de Sangha.',
}

export default function PolitiqueConfidentialite() {
  // Google OAuth est activé côté auth.purama.dev (VPS partagé) sans env var locale à cette
  // app — activeProcessors() ne peut pas le détecter automatiquement, ajouté ici à la main.
  const sections = buildPolitiqueConfidentialite(LEGAL_CONFIG, process.env, [
    'Connexion via Google (authentification tierce) : Google Ireland Limited (Union européenne).',
  ])
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.confidentialite[LEGAL_VERSIONS_HISTORY.confidentialite.length - 1].date

  return <LegalPage titre="Politique de Confidentialité" sections={sections} derniereMiseAJour={derniereMiseAJour} />
}
