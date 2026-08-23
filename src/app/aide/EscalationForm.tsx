'use client'

import { useState, useCallback } from 'react'
import { Send, Bot, Loader2 } from 'lucide-react'

interface EscalationFormProps {
  onOpenChat: () => void
}

export default function EscalationForm({ onOpenChat }: EscalationFormProps) {
  const [escName, setEscName] = useState('')
  const [escEmail, setEscEmail] = useState('')
  const [escMessage, setEscMessage] = useState('')
  const [escSending, setEscSending] = useState(false)
  const [escSent, setEscSent] = useState(false)
  const [escError, setEscError] = useState('')

  const sendEscalation = useCallback(async () => {
    if (!escName.trim() || !escEmail.trim() || !escMessage.trim()) return
    setEscSending(true)
    setEscError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: escName.trim(), email: escEmail.trim(), subject: 'Escalade aide Sangha', message: escMessage.trim() }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setEscSent(true)
    } catch {
      setEscError('Impossible d’envoyer le message. Verifie ta connexion et reessaie.')
    } finally {
      setEscSending(false)
    }
  }, [escName, escEmail, escMessage])

  return (
    <div className="mt-12 rounded-2xl bg-gradient-to-r from-[var(--cyan)]/10 to-[var(--purple)]/10 p-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] text-center">Tu n&apos;as pas trouve ta reponse ?</h2>
      <p className="mt-2 text-[var(--text-secondary)] text-center">Ecris-nous directement, notre equipe te repond sous 24h.</p>
      {escSent ? (
        <div className="mt-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--green)]/20 text-[var(--green)]">
            <Send className="h-5 w-5" />
          </div>
          <p className="mt-3 font-medium text-[var(--text-primary)]">Message envoye !</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">On revient vers toi rapidement.</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); sendEscalation() }} className="mt-6 space-y-4 max-w-lg mx-auto">
          <div>
            <label htmlFor="esc-name" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Ton prenom</label>
            <input id="esc-name" type="text" value={escName} onChange={e => setEscName(e.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--cyan)]" />
          </div>
          <div>
            <label htmlFor="esc-email" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Ton email</label>
            <input id="esc-email" type="email" value={escEmail} onChange={e => setEscEmail(e.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--cyan)]" />
          </div>
          <div>
            <label htmlFor="esc-msg" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Ton message</label>
            <textarea id="esc-msg" value={escMessage} onChange={e => setEscMessage(e.target.value)} required rows={4} className="w-full resize-none rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--cyan)]" />
          </div>
          {escError && <p className="text-sm text-red-400">{escError}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={escSending} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-6 py-3 font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
              {escSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer
            </button>
            <button type="button" onClick={onOpenChat} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/5 px-6 py-3 font-medium text-[var(--text-primary)] hover:bg-white/10 transition-colors">
              <Bot className="h-4 w-4" /> Assistant IA
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
