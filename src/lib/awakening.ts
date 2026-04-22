/**
 * Awakening layer — affirmations, citations sagesse, micro-textes empowering.
 * V7.2 §15 Toujours actif : affirmation quotidienne, citations, micro-textes,
 * géométrie sacrée. Naturel, jamais prosélyte.
 */

import { createServiceClient } from '@/lib/supabase'

export type AwakeningCategory = 'love' | 'power' | 'abundance' | 'health' | 'wisdom' | 'gratitude'

export interface Affirmation {
  id: string
  category: AwakeningCategory
  text_fr: string
  text_en: string
  frequency_weight: number
}

/**
 * Récupère une affirmation random pondérée dans la catégorie.
 * Si category null → toutes les catégories.
 */
export async function getAffirmation(
  category: AwakeningCategory | null = null,
  lang: 'fr' | 'en' = 'fr',
): Promise<{ id: string; text: string; category: AwakeningCategory } | null> {
  const service = createServiceClient()
  let query = service.from('affirmations').select('*')
  if (category) query = query.eq('category', category)
  const { data } = await query
  if (!data || data.length === 0) return null
  // Tirage pondéré
  const total = data.reduce((s, a) => s + (a.frequency_weight ?? 1), 0)
  let r = Math.random() * total
  for (const a of data as Affirmation[]) {
    r -= a.frequency_weight ?? 1
    if (r <= 0) return { id: a.id, text: lang === 'en' ? a.text_en : a.text_fr, category: a.category }
  }
  const first = data[0] as Affirmation
  return { id: first.id, text: lang === 'en' ? first.text_en : first.text_fr, category: first.category }
}

export type AwakeningEvent =
  | 'affirmation_seen'
  | 'breath_session_done'
  | 'gratitude_entry_added'
  | 'intention_set'
  | 'mission_completed'
  | 'ritual_joined'

/**
 * Log un événement d'éveil + incrémente XP user.
 */
export async function trackAwakening(userId: string, event: AwakeningEvent, xp = 5): Promise<void> {
  const service = createServiceClient()
  await service.from('awakening_events').insert({
    user_id: userId,
    event_type: event,
    xp_gained: xp,
  })
}

/**
 * Micro-texte empowering selon contexte.
 * Injecté à des moments clés (succès mission, streak, palier).
 */
export type EmpowermentContext =
  | 'mission_success'
  | 'streak_milestone'
  | 'palier_reached'
  | 'gains_received'
  | 'community_gratitude'
  | 'first_withdrawal'

const EMPOWERMENT_MESSAGES: Record<EmpowermentContext, string[]> = {
  mission_success: [
    'Ton geste rejoint le flux. Merci.',
    'Une goutte d\'océan qui change la marée.',
    'Tu viens de semer. La graine pousse.',
  ],
  streak_milestone: [
    'Ta constance devient ton superpouvoir.',
    'Jour après jour, tu te construis.',
    'La persévérance change le monde, pas l\'explosion.',
  ],
  palier_reached: [
    'Tu avances. Tu deviens. Tu comptes.',
    'Nouveau seuil franchi — merci pour le mouvement.',
    'Chaque palier est un pas vers ton meilleur toi.',
  ],
  gains_received: [
    'Tu reçois ce que tu as semé.',
    'Le bien que tu fais revient.',
    'Abondance en retour de ta présence.',
  ],
  community_gratitude: [
    'La gratitude circule. Elle te traverse.',
    'Ton énergie nourrit le collectif.',
    'Nous sommes un champ partagé.',
  ],
  first_withdrawal: [
    'Ton premier retrait — une étape concrète.',
    'Tu viens de transformer du karma en euros.',
    'L\'économie du don est réelle. Tu en es la preuve.',
  ],
}

export function getEmpowermentMessage(ctx: EmpowermentContext): string {
  const msgs = EMPOWERMENT_MESSAGES[ctx]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

/**
 * Niveaux d'éveil : Graine → Bâtisseur → Gardien → Source → Lumière
 * Basé sur awakening_level dans profiles (XP cumulé).
 */
export function getAwakeningLevel(xp: number): { level: number; label: string; nextAt: number } {
  if (xp < 100)  return { level: 1, label: 'Graine',    nextAt: 100 }
  if (xp < 500)  return { level: 2, label: 'Bâtisseur', nextAt: 500 }
  if (xp < 2000) return { level: 3, label: 'Gardien',   nextAt: 2000 }
  if (xp < 8000) return { level: 4, label: 'Source',    nextAt: 8000 }
  return { level: 5, label: 'Lumière', nextAt: Infinity }
}

export const WISDOM_QUOTES: string[] = [
  '« Be the change you wish to see. » — Gandhi',
  '« Tout ce que tu donnes te revient. » — Proverbe',
  '« La paix commence par un sourire. » — Mère Teresa',
  '« Le chemin, c\'est la récompense. » — Dalaï-Lama',
  '« Vis comme si tu devais mourir demain, apprends comme si tu devais vivre toujours. » — Gandhi',
  '« Ce que tu fais a besoin d\'importance — pour toi, d\'abord. » — Thich Nhat Hanh',
  '« L\'amour est la seule réponse. » — Rumi',
]

export function getRandomQuote(): string {
  return WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)]
}
