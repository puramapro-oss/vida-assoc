export type GiftType =
  | 'points_small'
  | 'coupon_5'
  | 'coupon_10'
  | 'ticket'
  | 'credits'
  | 'coupon_20'
  | 'points_mega'
  | 'coupon_50'

export interface DailyGift {
  id: string
  gift_type: GiftType
  gift_label: string
  gift_value: string
  points_earned: number
  credits_earned: number
  tickets_earned: number
  coupon_discount: number | null
  coupon_days: number | null
  coupon_expires_at: string | null
  streak_count: number
  opened_at: string
}

export type ChestState = 'closed' | 'opening' | 'revealed'
