'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Search, Sparkles, Gift, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Product } from '@/types'

const CATEGORIES: Array<{ id: 'all' | Product['category']; label: string; emoji: string }> = [
  { id: 'all',                label: 'Tout',          emoji: '🌿' },
  { id: 'bracelet',           label: 'Bracelets',     emoji: '🪢' },
  { id: 'soin',               label: 'Soins',         emoji: '🌸' },
  { id: 'formation',          label: 'Formations',    emoji: '📚' },
  { id: 'purificateur_eau',   label: 'Purificateurs', emoji: '💧' },
  { id: 'jardin',             label: 'Jardin',        emoji: '🌱' },
  { id: 'livre',              label: 'Livres',        emoji: '📖' },
  { id: 'telephone',          label: 'Téléphones',    emoji: '📱' },
  { id: 'autre',              label: 'Autre',         emoji: '✨' },
]

export default function BoutiquePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<'all' | Product['category']>('all')

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const { data } = await sb
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60)
      setProducts((data as Product[] | null) ?? [])
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (!q) return true
      return `${p.name} ${p.description ?? ''}`.toLowerCase().includes(q)
    })
  }, [products, search, cat])

  if (loading) {
    return <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">Chargement de la boutique…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="boutique-page">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Boutique Sangha</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Bracelets, livres, soins, purificateurs… Chaque achat reverse 5 à 10 % en crédits Sangha pour les associations.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher un produit…"
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm focus:border-[#D4AF37] focus:outline-none"
            data-testid="boutique-search"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
                cat === c.id
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🛍️" title="Aucun produit" description="Essaie une autre catégorie ou recherche." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
              className="group rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:border-[#D4AF37]/40 transition"
              data-testid="product-card"
            >
              <div className="relative aspect-square bg-gradient-to-br from-[#D4AF37]/15 to-[var(--cyan)]/5">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">🌿</div>
                )}
                {p.featured && (
                  <span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold text-[#0A0A0F]">
                    ⭐ Coup de cœur
                  </span>
                )}
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Gift className="h-3 w-3 text-[var(--green)]" /> +{p.vida_cashback_percent}%
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)] line-clamp-1">
                  {p.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{p.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-[#D4AF37]">{formatPrice(p.price_cents)}</p>
                  {p.external_url ? (
                    <a
                      href={p.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:border-[#D4AF37] hover:text-[#D4AF37] transition"
                      data-testid="product-buy"
                    >
                      <Sparkles className="h-3 w-3" /> Acheter <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Bientôt</span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-[var(--text-muted)] flex items-start gap-2">
        <Gift className="h-4 w-4 text-[var(--green)] shrink-0 mt-0.5" />
        <p>
          Chaque achat dans la boutique Sangha finance directement les associations partenaires. Le cashback vient gonfler tes
          crédits utilisables sur tes prochains dons et formations.
        </p>
      </footer>
    </div>
  )
}
