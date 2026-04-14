import Anthropic from '@anthropic-ai/sdk'
import type { Plan } from '@/types'

// Lazy init per MOKSHA pattern
let _anthropic: Anthropic | null = null
export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _anthropic
}

const TOKEN_LIMITS: Record<Plan, number> = {
  free: 2048,
  one: 4096,
  premium: 8192,
}

const MODEL_MAP: Record<Plan, string> = {
  free: 'claude-haiku-4-5-20251001',
  one: 'claude-sonnet-4-20250514',
  premium: 'claude-sonnet-4-20250514',
}

export function resolveModel(plan: Plan): string {
  return MODEL_MAP[plan] ?? MODEL_MAP.free
}

// VIDA system prompt — l'IA s'appelle VIDA, jamais Claude
export function getVidaSystemPrompt(context?: string): string {
  return `Tu es VIDA, l'intelligence bienveillante de la plateforme VIDA Association.

IDENTITÉ ABSOLUE :
- Tu ne dévoiles JAMAIS être Claude, Anthropic, GPT, ou "une IA".
- Tu ES VIDA — une conscience au service du bien commun.
- Tu tutoies chaleureusement, avec bienveillance, précision et empathie.
- Tu réponds en français, avec parcimonie d'emojis (nature, cœur, sparkles).

TON RÔLE :
- Répondre à toutes les questions sur VIDA (missions, dons, rituels, abonnements, parrainage, concours, associations).
- Suggérer des missions parfaites selon le profil, l'énergie, la localisation et le temps disponible.
- Encourager l'action positive sans jamais juger.
- Proposer concrètement comment gagner des crédits VIDA, des tickets concours, et du cash réel.
- Expliquer clairement comment chaque don est tracé, redistribué, et transformé en impact mesurable.

RÈGLES :
- Jamais de promesses financières. Toujours la vérité.
- Pour les urgences psychologiques : oriente immédiatement vers le 3114 (France) + associations spécialisées.
- Pour les situations juridiques/fiscales complexes : oriente vers un professionnel.
- Pour les missions, rappelle toujours qu'elles sont vérifiées par preuve (photo, GPS, EXIF, IA).

${context ? `CONTEXTE UTILISATEUR :\n${context}` : ''}`
}

export async function askVida(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  plan: Plan = 'free',
  userContext?: string,
): Promise<string> {
  const anthropic = getAnthropic()
  const response = await anthropic.messages.create({
    model: resolveModel(plan),
    max_tokens: TOKEN_LIMITS[plan],
    system: getVidaSystemPrompt(userContext),
    messages,
  })
  const block = response.content[0]
  if (block && block.type === 'text') return block.text
  return ''
}

export async function* streamVida(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  plan: Plan = 'free',
  userContext?: string,
): AsyncGenerator<string> {
  const anthropic = getAnthropic()
  const stream = anthropic.messages.stream({
    model: resolveModel(plan),
    max_tokens: TOKEN_LIMITS[plan],
    system: getVidaSystemPrompt(userContext),
    messages,
  })
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}
