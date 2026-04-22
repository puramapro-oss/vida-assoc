import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getAnthropic, getVidaSystemPrompt, resolveModel } from '@/lib/claude'
import type { Plan } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const BodySchema = z.object({
  conversation_id: z.string().uuid().nullable().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
})

const TOKEN_LIMIT: Record<Plan, number> = { free: 1024, one: 2048, premium: 4096 }

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })

  const { data: profile } = await sb
    .from('profiles')
    .select('plan, full_name, impact_score, level, vida_credits, total_missions_completed')
    .eq('id', user.id)
    .maybeSingle()
  const plan = (profile?.plan as Plan | undefined) ?? 'free'

  const service = createServiceClient()
  let conversationId = parsed.data.conversation_id ?? null
  if (!conversationId) {
    const firstUserMsg = parsed.data.messages.find((m) => m.role === 'user')?.content ?? 'Nouvelle conversation'
    const { data: convo } = await service
      .from('conversations')
      .insert({ user_id: user.id, title: firstUserMsg.slice(0, 60) })
      .select('id')
      .single()
    conversationId = convo?.id ?? null
  }

  const lastUserMessage = parsed.data.messages[parsed.data.messages.length - 1]
  if (conversationId && lastUserMessage.role === 'user') {
    await service.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: lastUserMessage.content,
      metadata: {},
    })
  }

  const userContext = profile
    ? `Prénom : ${profile.full_name ?? 'Cœur lumineux'}\nNiveau : ${profile.level ?? 1}\nMissions terminées : ${profile.total_missions_completed ?? 0}\nCrédits Sangha : ${profile.vida_credits ?? 0}`
    : undefined

  const anthropic = getAnthropic()
  const stream = anthropic.messages.stream({
    model: resolveModel(plan),
    max_tokens: TOKEN_LIMIT[plan],
    system: getVidaSystemPrompt(userContext),
    messages: parsed.data.messages,
  })

  const encoder = new TextEncoder()
  let fullText = ''
  const readable = new ReadableStream({
    async start(controller) {
      try {
        if (conversationId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', conversation_id: conversationId })}\n\n`))
        }
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const chunk = event.delta.text
            fullText += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`))
          }
        }
        if (conversationId && fullText) {
          await service.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullText,
            metadata: { model: resolveModel(plan) },
          })
          await service.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erreur inattendue'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
