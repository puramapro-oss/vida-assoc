// Sangha — Database Models (extracted from index.ts to keep under 300 lines)

import type { Profile, Role, Plan, SubscriptionInterval, AccessibilityMode, NotificationMode, Theme } from './index'

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

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referral_code: string
  status: 'pending' | 'converted' | 'active' | 'churned'
  first_subscription_earned_cents: number
  lifetime_earned_cents: number
  created_at: string
  converted_at: string | null
}

export interface ReferralCommission {
  id: string
  referral_id: string
  referrer_id: string
  amount_cents: number
  commission_type: 'first_subscription' | 'recurring' | 'cross_app' | 'bonus'
  source_type: string | null
  source_id: string | null
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  created_at: string
  paid_at: string | null
}

export interface Influencer {
  id: string
  user_id: string
  promo_code: string
  promo_link: string
  promo_expiry_days: number
  commission_first_percent: number
  commission_recurring_percent: number
  discount_percent: number
  bio: string | null
  social_links: Record<string, string>
  approved: boolean
  total_clicks: number
  total_conversions: number
  total_earned_cents: number
  dashboard_enabled: boolean
  created_at: string
}

export interface ImpactTracker {
  id: string
  user_id: string
  mission_id: string | null
  impact_type: 'co2_saved_kg' | 'waste_collected_kg' | 'water_protected_l' | 'trees_planted' | 'people_helped' | 'meals_distributed' | 'hours_volunteered' | 'money_donated_cents' | 'animals_helped' | 'energy_saved_kwh'
  impact_value: number
  impact_unit: string | null
  equivalent_text: string | null
  created_at: string
}

export interface ImpactGlobal {
  date: string
  total_co2_kg: number
  total_waste_kg: number
  total_water_l: number
  total_trees: number
  total_people_helped: number
  total_meals: number
  total_hours_volunteered: number
  total_missions: number
  total_users: number
  total_donated_cents: number
  updated_at: string
}

export interface Contest {
  id: string
  title: string
  description: string | null
  type: 'weekly' | 'monthly' | 'yearly' | 'special'
  prizes: Array<{ rank: number; description: string; value_cents: number }>
  total_pool_cents: number
  start_date: string
  end_date: string
  entry_method: 'missions' | 'subscription' | 'donations' | 'purchases' | 'automatic'
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  image_url: string | null
  created_at: string
}

export interface Ritual {
  id: string
  title: string
  description: string | null
  type: 'pleine_lune' | 'portail_energetique' | 'depollution' | 'paix' | 'amour' | 'pardon' | 'gratitude' | 'abondance' | 'soin_collectif'
  intention: string
  guided_steps: Array<{ step: number; title: string; duration_min: number; audio_url?: string }>
  scheduled_at: string
  duration_minutes: number
  participants_count: number
  reward_vida_credits: number
  status: 'upcoming' | 'live' | 'completed'
  image_url: string | null
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  price_cents: number
  currency: string
  category: string
  image_url: string | null
  images: string[]
  stock: number
  vida_cashback_percent: number
  featured: boolean
  external_url: string | null
  status: 'active' | 'draft' | 'sold_out' | 'archived'
}

export interface Formation {
  id: string
  slug: string
  title: string
  description: string | null
  type: 'video' | 'livre' | 'papier' | 'audio' | 'interactive'
  target_audience: 'adulte' | 'enfant' | 'handicap_visuel' | 'handicap_auditif' | 'handicap_moteur' | 'senior' | 'tous'
  duration_minutes: number | null
  modules: Array<{ id: string; title: string; duration: number; content_url: string }>
  content_url: string | null
  thumbnail_url: string | null
  is_free: boolean
  price_cents: number
  required_plan: Plan | null
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  action_url: string | null
  icon: string | null
  read: boolean
  read_at: string | null
  created_at: string
}

export interface FaqArticle {
  id: string
  category: string
  question: string
  answer: string
  search_keywords: string | null
  view_count: number
  helpful_count: number
  position: number
}

export interface CommunityPost {
  id: string
  user_id: string
  content: string
  media_url: string | null
  type: 'text' | 'photo' | 'video' | 'mission' | 'victory' | 'question' | 'gratitude'
  mission_id: string | null
  likes_count: number
  comments_count: number
  hidden: boolean
  created_at: string
  author?: Profile
}

export interface WalletTransaction {
  id: string
  user_id: string
  amount_cents: number
  currency: string
  type: 'mission_reward' | 'referral_commission' | 'contest_prize' | 'influencer_commission' | 'withdrawal' | 'refund' | 'bonus' | 'fund_distribution'
  source_id: string | null
  description: string | null
  balance_after_cents: number | null
  created_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'signup' | 'mission' | 'ritual' | 'daily_quest' | 'referral' | 'streak' | 'purchase_cashback' | 'ad_spend' | 'redeem' | 'admin_adjust' | 'level_up'
  source_id: string | null
  description: string | null
  balance_after: number | null
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}
