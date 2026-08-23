// Sangha — Database Models (extracted from index.ts to keep under 300 lines)

import type { SubscriptionInterval } from './index'

export interface Association {
  id: string
  slug: string
  name: string
  vida_name: string | null
  logo_url: string | null
  cover_url: string | null
  description: string | null
  mission_statement: string | null
  category: string | null
  verified: boolean
  country: string | null
  region: string | null
  city: string | null
  website: string | null
  impact_score: number
  missions_count: number
  donations_received_cents: number
  volunteers_count: number
  featured: boolean
  stripe_account_id: string | null
  balance_cents: number
  created_at: string
  updated_at: string
}

export interface Mission {
  id: string
  title: string
  description: string
  type: string
  category_id: string
  creator_type: 'vida' | 'association' | 'enterprise' | 'ong' | 'user'
  creator_id: string | null
  association_id: string | null
  reward_type: 'money' | 'vida_credits' | 'promo' | 'contest_tickets' | 'mixed'
  reward_amount_cents: number
  reward_vida_credits: number
  reward_contest_tickets: number
  reward_promo_percent: number
  escrow_locked_cents: number
  escrow_released: boolean
  location_lat: number | null
  location_lng: number | null
  location_name: string | null
  location_radius_km: number | null
  duration_minutes: number | null
  max_participants: number
  current_participants: number
  difficulty: 'facile' | 'moyen' | 'difficile' | 'expert' | null
  verification_method: 'photo' | 'video' | 'photo_before_after' | 'gps' | 'ai_auto' | 'mutual_confirmation' | 'exif' | 'qr' | 'health'
  proof_required: boolean
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'expired' | 'pending_review'
  is_collective: boolean
  is_sponsored: boolean
  is_public: boolean
  featured: boolean
  image_url: string | null
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  expires_at: string | null
}

export interface MissionCompletion {
  id: string
  mission_id: string
  user_id: string
  status: 'pending' | 'validated' | 'rejected' | 'disputed'
  proof_photo_url: string | null
  proof_photo_before_url: string | null
  proof_photo_after_url: string | null
  proof_video_url: string | null
  proof_gps_lat: number | null
  proof_gps_lng: number | null
  proof_exif_data: Record<string, unknown> | null
  proof_text: string | null
  ai_validation_score: number | null
  ai_validation_notes: string | null
  human_review_needed: boolean
  validated_at: string | null
  reward_paid: boolean
  reward_paid_at: string | null
  created_at: string
}

export interface Donation {
  id: string
  donor_id: string | null
  recipient_type: 'association' | 'vida' | 'project' | 'user'
  recipient_id: string | null
  amount_cents: number
  currency: string
  payment_method: string | null
  is_recurring: boolean
  recurring_interval: 'weekly' | 'monthly' | 'yearly' | null
  round_up_enabled: boolean
  round_up_amount_cents: number
  vida_commission_percent: number
  vida_commission_cents: number
  stripe_payment_intent_id: string | null
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  anonymous: boolean
  message: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'one' | 'premium'
  interval: SubscriptionInterval
  price_cents: number
  currency: string
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused' | 'incomplete'
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  paused_at: string | null
  started_at: string
  cancelled_at: string | null
}

export interface Invoice {
  id: string
  user_id: string
  number: string
  subscription_id: string | null
  amount_cents: number
  currency: string
  pdf_url: string | null
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  issued_at: string
  paid_at: string | null
}
