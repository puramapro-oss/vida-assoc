// Sangha — Core types + re-exports from models.ts

export type Role = 'user' | 'association' | 'enterprise' | 'ong' | 'super_admin'
export type Plan = 'free' | 'one' | 'premium'
export type SubscriptionInterval = 'monthly' | 'yearly'
export type Theme = 'dark' | 'light' | 'oled' | 'auto'
export type AccessibilityMode = 'standard' | 'visuel' | 'auditif' | 'moteur' | 'enfant' | 'senior'
export type NotificationMode = 'zen' | 'normal' | 'actif' | 'silencieux'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  display_name: string | null // alias for UI
  avatar_url: string | null
  lang: string
  country: string | null
  region: string | null
  city: string | null
  role: Role
  plan: Plan
  subscription_interval: SubscriptionInterval | null
  trial_ends_at: string | null
  paused_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  vida_credits: number
  impact_score: number
  level: number
  xp: number
  streak_days: number
  last_active_at: string | null
  total_missions_completed: number
  total_donated_cents: number
  total_earned_cents: number
  wallet_balance_cents: number
  contest_tickets: number
  consciousness_level: string
  is_handicap: boolean
  handicap_type: string | null
  accessibility_mode: AccessibilityMode
  multisensorial_enabled: boolean
  notification_mode: NotificationMode
  theme: Theme
  referral_code: string | null
  referred_by: string | null
  tutorial_completed: boolean
  onboarded: boolean
  iban: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Re-export core models from models.ts
export type {
  Association,
  Mission,
  MissionCompletion,
  Donation,
  Subscription,
  Invoice,
} from './models'

// Re-export extended models from models-extended.ts
export type {
  Referral,
  ReferralCommission,
  Influencer,
  ImpactTracker,
  ImpactGlobal,
  Contest,
  Ritual,
  Product,
  Formation,
  Notification,
  FaqArticle,
  CommunityPost,
  WalletTransaction,
  CreditTransaction,
  Conversation,
  Message,
} from './models-extended'
