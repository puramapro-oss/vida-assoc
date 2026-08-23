'use client'

import CookieConsentBanner from '@/lib/legal/components/CookieConsentBanner'
import type { CookieConsent } from '@/lib/legal/hooks/useCookieConsent'

/**
 * Câble le bandeau cookies NIYAMA du socle (granularité mesure/marketing, persistance
 * localStorage pour le visiteur anonyme + POST /api/legal/cookie-consent pour une preuve
 * en base une fois authentifié) dans le layout racine. Remplace `CookieBanner` (décor,
 * localStorage seul, 0 granularité) — cf CONFORMITE.md point 2.
 */
export default function CookieConsentBannerClient() {
  function handleConsent(consent: CookieConsent) {
    void fetch('/api/legal/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesure: consent.mesure, marketing: consent.marketing }),
    }).catch(() => null)
  }

  return <CookieConsentBanner appName="Sangha" onConsent={handleConsent} />
}
