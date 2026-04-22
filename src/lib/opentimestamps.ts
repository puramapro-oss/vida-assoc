/**
 * OpenTimestamps — horodatage blockchain Bitcoin gratuit.
 * V4.1 §📜 (21/04/2026) — remplace OriginStamp (retired 31 mai 2025).
 * Utilisé pour horodater les règlements de jeux KARMA.
 *
 * Coût : 0€. Fiabilité : blockchain Bitcoin (calendar servers Peter Todd).
 * Vérification : ots_proof_verified passe à true quand le stamp est
 * inclus dans un bloc Bitcoin (~1-6h après stamp).
 */

import crypto from 'crypto'

/**
 * SHA-256 d'un contenu texte (utf-8).
 */
export function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex')
}

/**
 * Stamp un hash SHA-256 sur les calendar servers OpenTimestamps.
 * Retourne le .ots proof (binary Buffer) à stocker dans un bucket.
 * Vérifiable gratuitement via https://opentimestamps.org/.
 */
export async function stampHash(sha256Hex: string): Promise<Buffer> {
  // Dynamic import to avoid bundling issues when lib is used server-side only
  const ots = await import('javascript-opentimestamps')
  const hashBuffer = Buffer.from(sha256Hex, 'hex')
  const detachedOp = ots.DetachedTimestampFile.fromHash(new ots.Ops.OpSHA256(), hashBuffer)
  await ots.stamp(detachedOp)
  return Buffer.from(detachedOp.serializeToBytes())
}

/**
 * Vérifie un proof .ots. Retourne true si le proof a été inclus dans
 * un bloc Bitcoin (certain), false si pas encore upgradé (pending).
 */
export async function verifyProof(sha256Hex: string, proofBytes: Buffer): Promise<{
  verified: boolean
  pending: boolean
  bitcoinBlock?: number
  timestamp?: number
}> {
  try {
    const ots = await import('javascript-opentimestamps')
    const detached = ots.DetachedTimestampFile.deserialize(proofBytes)
    // Vérifie hash correspond
    const expected = Buffer.from(sha256Hex, 'hex')
    if (!Buffer.from(detached.fileDigest()).equals(expected)) {
      return { verified: false, pending: false }
    }
    // Upgrade (récupère attestation Bitcoin si disponible)
    try {
      await ots.upgrade(detached)
    } catch {
      // pas encore upgradé — toujours pending
      return { verified: false, pending: true }
    }
    const result = await ots.verify(detached)
    const bitcoinAttestation = result?.bitcoin
    if (bitcoinAttestation) {
      return {
        verified: true,
        pending: false,
        bitcoinBlock: bitcoinAttestation.height,
        timestamp: bitcoinAttestation.timestamp,
      }
    }
    return { verified: false, pending: true }
  } catch {
    return { verified: false, pending: false }
  }
}

export function hasOpenTimestamps(): boolean {
  try {
    require.resolve('javascript-opentimestamps')
    return true
  } catch {
    return false
  }
}
