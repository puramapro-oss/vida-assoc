'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Ticket, Trophy, Info } from 'lucide-react'

interface KarmaGame {
  slug: string
  name: string
  description: string
  ticket_cost: number
  period: 'daily' | 'weekly' | 'monthly' | 'seasonal'
  active: boolean
}

interface KarmaPlay {
  id: string
  game_slug: string
  outcome: 'pending' | 'won' | 'lost'
  prize_cents: number
  prize_points: number
  played_at: string
}

export default function KarmaPage() {
  const [games, setGames] = useState<KarmaGame[]>([])
  const [tickets, setTickets] = useState(0)
  const [recent, setRecent] = useState<KarmaPlay[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)
  const [result, setResult] = useState<{ outcome: string; points: number; cents: number; game: string } | null>(null)

  async function load() {
    queueMicrotask(() => setLoading(true))
    const res = await fetch('/api/karma/play')
    const d = await res.json()
    if (!d.error) {
      queueMicrotask(() => {
        setGames(d.games ?? [])
        setTickets(d.tickets ?? 0)
        setRecent(d.recent_plays ?? [])
      })
    }
    queueMicrotask(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function play(slug: string) {
    setPlaying(slug)
    setResult(null)
    const res = await fetch('/api/karma/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_slug: slug }),
    })
    const d = await res.json()
    setPlaying(null)
    if (!d.error) {
      setResult({
        outcome: d.play.outcome,
        points: d.play.prize_points,
        cents: d.play.prize_cents,
        game: d.game.name,
      })
      await load()
    }
  }

  if (loading) return <div className="p-6 text-[var(--text-muted)]">Chargement des jeux KARMA…</div>

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h1 className="text-2xl font-semibold">KARMA</h1>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              6 jeux solidaires. Gagne des tickets en agissant — jamais en payant.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2">
            <Ticket className="h-4 w-4 text-amber-400" />
            <span className="font-semibold">{tickets}</span>
            <span className="text-xs text-[var(--text-muted)]">ticket{tickets > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-[var(--text-muted)] inline-flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          Hors champ ANJ. <Link href="/karma-regulation" className="text-amber-400 hover:underline">Règlement horodaté blockchain</Link>
        </div>
      </motion.section>

      {result && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`glass rounded-2xl p-5 border-2 ${
            result.outcome === 'won' ? 'border-emerald-500/40' : 'border-white/10'
          }`}
        >
          <p className="font-semibold">
            {result.outcome === 'won' ? '🎉 Gagné !' : '🙏 Merci d\'avoir joué.'}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {result.game} —
            {result.points > 0 && ` +${result.points} points`}
            {result.cents > 0 && ` +${(result.cents / 100).toFixed(2)}€`}
            {result.points === 0 && result.cents === 0 && ' Réessaie demain.'}
          </p>
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-xs text-[var(--text-muted)] hover:text-white"
          >
            Fermer
          </button>
        </motion.div>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        {games.map((g) => (
          <div key={g.slug} className="glass rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold">{g.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] capitalize">
                {g.period === 'daily' ? 'Quotidien' : g.period === 'weekly' ? 'Hebdo' : g.period === 'monthly' ? 'Mensuel' : 'Saisonnier'}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] flex-1">{g.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
                <Ticket className="h-3 w-3" /> Coût : {g.ticket_cost} ticket{g.ticket_cost > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => play(g.slug)}
                disabled={playing === g.slug || tickets < g.ticket_cost}
                className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                {playing === g.slug ? 'Tirage…' : 'Jouer'}
              </button>
            </div>
          </div>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold">Mes derniers tirages</h2>
          </div>
          <ul className="space-y-2">
            {recent.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[var(--text-muted)]">{p.game_slug.replace(/_/g, ' ')}</span>
                <span className={p.outcome === 'won' ? 'text-emerald-400' : 'text-[var(--text-muted)]'}>
                  {p.outcome === 'won' ? (
                    <>
                      {p.prize_points > 0 && `+${p.prize_points} pts`}
                      {p.prize_cents > 0 && ` +${(p.prize_cents / 100).toFixed(2)}€`}
                    </>
                  ) : 'Non gagné'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
