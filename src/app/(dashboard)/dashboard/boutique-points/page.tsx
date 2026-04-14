'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Star, Zap, Tag, CreditCard, Ticket, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

interface PointShopItem {
  id: string
  category: 'reduction' | 'subscription' | 'ticket' | 'feature' | 'cash'
  name: string
  description: string
  cost_points: number
  type: string
}

const CATEGORY_META: Record<
  PointShopItem['category'],
  { label: string; icon: React.ElementType; color: string; variant: 'green' | 'gold' | 'cyan' | 'purple' | 'orange' }
> = {
  reduction: { label: 'Réductions', icon: Tag, color: '#10B981', variant: 'green' },
  subscription: { label: 'Abonnements', icon: Star, color: '#D4AF37', variant: 'gold' },
  ticket: { label: 'Tickets', icon: Ticket, color: '#06B6D4', variant: 'cyan' },
  feature: { label: 'Fonctionnalités', icon: Zap, color: '#A855F7', variant: 'purple' },
  cash: { label: 'Cash', icon: CreditCard, color: '#F97316', variant: 'orange' },
}

const CATEGORIES = Object.entries(CATEGORY_META) as [
  PointShopItem['category'],
  (typeof CATEGORY_META)[PointShopItem['category']],
][]

function formatPoints(n: number) {
  return n.toLocaleString('fr-FR') + ' pts'
}

export default function BoutiquePointsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [items, setItems] = useState<PointShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [activeCategory, setActiveCategory] = useState<PointShopItem['category'] | 'all'>('all')

  useEffect(() => {
    if (!user) return
    const sb = createClient()
    ;(async () => {
      const [itemsRes, pointsRes] = await Promise.all([
        sb
          .from('point_shop_items')
          .select('*')
          .order('cost_points', { ascending: true }),
        sb.from('purama_points').select('balance').eq('user_id', user.id).single(),
      ])
      setItems((itemsRes.data as PointShopItem[] | null) ?? [])
      setBalance((pointsRes.data?.balance as number | null) ?? 0)
      setLoading(false)
    })()
  }, [user, profile])

  async function handlePurchase(item: PointShopItem) {
    if (balance < item.cost_points) return
    setPurchasing(item.id)
    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purchase', item_id: item.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Échange impossible')
      setBalance(json.balance ?? balance - item.cost_points)
      toast.success(`"${item.name}" obtenu avec succès !`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Une erreur est survenue. Réessaie.')
    } finally {
      setPurchasing(null)
    }
  }

  const visibleItems =
    activeCategory === 'all' ? items : items.filter((i) => i.category === activeCategory)

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center text-[var(--text-muted)]">
        Chargement de la boutique…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState
          icon="🔒"
          title="Connecte-toi"
          description="Accède à la boutique de points après connexion."
        />
        <Button
          className="mt-4"
          onClick={() => (window.location.href = '/login?next=/dashboard/boutique-points')}
        >
          Se connecter
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10" data-testid="boutique-points-page">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#10B981]/10 text-[#10B981]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
              Boutique de points
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Échange tes points VIDA contre des réductions, abonnements et bien plus.
            </p>
          </div>
        </div>

        {/* Balance badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/15 to-[#10B981]/10 px-5 py-3 text-right"
        >
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Ton solde</p>
          <p
            className="font-[family-name:var(--font-display)] text-3xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #10B981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            data-testid="points-balance"
          >
            {balance.toLocaleString('fr-FR')}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">points disponibles</p>
        </motion.div>
      </header>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
            activeCategory === 'all'
              ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
              : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
          }`}
        >
          <Sparkles className="inline h-3 w-3 mr-1" />
          Tout
        </button>
        {CATEGORIES.map(([catId, meta]) => {
          const Icon = meta.icon
          return (
            <button
              key={catId}
              type="button"
              onClick={() => setActiveCategory(catId)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                activeCategory === catId
                  ? `border-[${meta.color}] bg-[${meta.color}]/10 text-[${meta.color}]`
                  : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
              }`}
              style={
                activeCategory === catId
                  ? { borderColor: meta.color, color: meta.color, backgroundColor: `${meta.color}15` }
                  : undefined
              }
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Items grid */}
      {visibleItems.length === 0 ? (
        <EmptyState
          icon="🎁"
          title="Aucun article disponible"
          description="Reviens bientôt — de nouveaux articles arrivent régulièrement."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item, i) => {
            const meta = CATEGORY_META[item.category]
            const Icon = meta.icon
            const canAfford = balance >= item.cost_points
            const isLoading = purchasing === item.id

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                className={`group rounded-3xl border bg-white/5 p-5 flex flex-col gap-4 transition ${
                  canAfford ? 'border-white/10 hover:border-[#10B981]/40' : 'border-white/5 opacity-60'
                }`}
                data-testid="shop-item-card"
              >
                {/* Icon + badge */}
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${meta.color}18` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)] leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Cost + CTA */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <p
                    className="font-[family-name:var(--font-display)] text-lg font-bold"
                    style={{
                      background: canAfford
                        ? 'linear-gradient(135deg, #D4AF37, #10B981)'
                        : undefined,
                      WebkitBackgroundClip: canAfford ? 'text' : undefined,
                      WebkitTextFillColor: canAfford ? 'transparent' : undefined,
                      color: canAfford ? undefined : 'var(--text-muted)',
                    }}
                  >
                    {formatPoints(item.cost_points)}
                  </p>
                  <Button
                    size="sm"
                    variant={canAfford ? 'primary' : 'secondary'}
                    disabled={!canAfford || isLoading}
                    loading={isLoading}
                    onClick={() => handlePurchase(item)}
                    data-testid="shop-item-exchange"
                  >
                    {canAfford ? 'Échanger' : 'Insuffisant'}
                  </Button>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      {/* Footer tip */}
      <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-[var(--text-muted)] flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
        <p>
          Gagne des points en complétant des missions, en parrainant des amis, en partageant tes
          victoires et en maintenant ton streak quotidien. 1 000 pts = 10 % de réduction sur un
          abonnement.
        </p>
      </footer>
    </div>
  )
}
