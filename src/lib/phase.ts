/**
 * Purama Phase manager — bascule Phase 1 (primes wallet, carte teaser)
 * vs Phase 2 (primes + Purama Card active, Smart Split, cash immédiat).
 * Contrôlé par env PRIME_MODE=phase1|phase2. Voir STRIPE_CONNECT_KARMA V4.1 §🎁.
 */

export type PrimeMode = 'phase1' | 'phase2'

export function getPhase(): PrimeMode {
  const mode = process.env.PRIME_MODE
  return mode === 'phase2' ? 'phase2' : 'phase1'
}

export function isCardAvailable(): boolean {
  return getPhase() === 'phase2'
}

/**
 * Retrait wallet bloqué pendant 30 jours après l'inscription Phase 1.
 * (Loi V7.2 #5 — anti-fraude rétractation waiver L221-28 3°)
 */
export function isWithdrawalAvailable(signupAt: Date | string | null | undefined): boolean {
  if (!signupAt) return false
  const signup = typeof signupAt === 'string' ? new Date(signupAt) : signupAt
  const diffDays = (Date.now() - signup.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 30
}

export function daysUntilWithdrawal(signupAt: Date | string | null | undefined): number {
  if (!signupAt) return 30
  const signup = typeof signupAt === 'string' ? new Date(signupAt) : signupAt
  const diffDays = (Date.now() - signup.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(30 - diffDays))
}
