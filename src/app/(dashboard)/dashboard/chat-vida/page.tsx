'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Quelle mission me correspond aujourd\'hui ?',
  'Comment fonctionnent les dons sur Sangha ?',
  'Comment passer du niveau Graine au niveau Bâtisseur ?',
  'Explique-moi le parrainage Sangha en 30 secondes',
]

export default function ChatVidaPage() {
  const { user, loading: authLoading } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  async function send(content: string) {
    if (!content.trim() || streaming) return
    if (!user) {
      window.location.assign('/login?next=/dashboard/chat-vida')
      return
    }
    setError(null)
    const next: Msg[] = [...messages, { role: 'user', content }, { role: 'assistant', content: '' }]
    setMessages(next)
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat-vida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          messages: next.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Sangha n\'a pas pu répondre.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const evt = JSON.parse(data)
            if (evt.type === 'meta' && evt.conversation_id) setConversationId(evt.conversation_id)
            if (evt.type === 'delta' && typeof evt.text === 'string') {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last && last.role === 'assistant') updated[updated.length - 1] = { ...last, content: last.content + evt.text }
                return updated
              })
            }
            if (evt.type === 'error') throw new Error(evt.error)
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  if (authLoading) {
    return <div className="mx-auto max-w-4xl py-12 text-center text-[var(--text-muted)]">Chargement…</div>
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col h-[calc(100vh-9rem)] gap-4" data-testid="chat-vida">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#10B981]" /> Sangha
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">Pose toutes tes questions — Sangha répond avec bienveillance.</p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="space-y-4 py-8 text-center">
            <p className="text-[var(--text-secondary)]">Quelques pistes pour démarrer :</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  data-testid="chat-suggestion"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-[var(--text-secondary)] hover:border-[#10B981]/40 hover:text-[var(--text-primary)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white'
                    : 'border border-white/10 bg-white/5 text-[var(--text-primary)]'
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : null)}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          rows={1}
          placeholder="Écris à Sangha…"
          data-testid="chat-input"
          className="flex-1 max-h-32 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#10B981] focus:outline-none"
        />
        <Button type="submit" loading={streaming} disabled={!input.trim() || streaming} data-testid="chat-send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
