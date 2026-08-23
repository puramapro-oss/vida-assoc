import { Star, Tag, Ticket, Zap, Gift } from 'lucide-react'
import type { GiftType } from './types'

export const GIFT_META: Record<
  GiftType,
  { icon: React.ReactNode; color: string; bg: string; emoji: string }
> = {
  points_small: {
    icon: <Star className="w-8 h-8" />,
    color: '#10B981',
    bg: 'from-emerald-500/20 to-emerald-600/10',
    emoji: '⭐',
  },
  coupon_5: {
    icon: <Tag className="w-8 h-8" />,
    color: '#D4AF37',
    bg: 'from-yellow-500/20 to-yellow-600/10',
    emoji: '🏷️',
  },
  coupon_10: {
    icon: <Tag className="w-8 h-8" />,
    color: '#D4AF37',
    bg: 'from-yellow-500/20 to-amber-600/10',
    emoji: '🏷️',
  },
  ticket: {
    icon: <Ticket className="w-8 h-8" />,
    color: '#a855f7',
    bg: 'from-purple-500/20 to-purple-600/10',
    emoji: '🎫',
  },
  credits: {
    icon: <Zap className="w-8 h-8" />,
    color: '#06b6d4',
    bg: 'from-cyan-500/20 to-cyan-600/10',
    emoji: '⚡',
  },
  coupon_20: {
    icon: <Tag className="w-8 h-8" />,
    color: '#f59e0b',
    bg: 'from-orange-500/20 to-orange-600/10',
    emoji: '💥',
  },
  points_mega: {
    icon: <Star className="w-8 h-8" />,
    color: '#D4AF37',
    bg: 'from-yellow-400/30 to-emerald-500/20',
    emoji: '🌟',
  },
  coupon_50: {
    icon: <Gift className="w-8 h-8" />,
    color: '#ec4899',
    bg: 'from-pink-500/30 to-pink-600/10',
    emoji: '🎁',
  },
}
