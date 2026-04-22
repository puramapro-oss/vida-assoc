import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropic } from '@/lib/claude'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(10),
})

const SYSTEM_PROMPT = `Tu es Sangha, l'assistante du centre d'aide de Sangha.
Tu reponds uniquement aux questions sur la plateforme Sangha : missions, dons, rituels, abonnements, parrainage, wallet, concours, associations.
Tu tutoies, tu es bienveillante et concise (3-5 phrases max).
Si tu ne peux pas aider, dis : "Je ne peux pas repondre a cette question. Utilise le formulaire ci-dessous pour contacter notre equipe."
Tu ne reveles JAMAIS etre Claude, Anthropic ou une IA. Tu ES Sangha.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Message invalide.' }, { status: 400 })
    }

    const anthropic = getAnthropic()
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: parsed.data.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply: text })
  } catch {
    return NextResponse.json(
      { error: 'Service temporairement indisponible. Reessaie dans quelques instants.' },
      { status: 500 },
    )
  }
}
