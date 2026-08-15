-- =========================================================================
-- VIDA ASSOCIATION — Schema complet
-- =========================================================================
-- Usage : PGPASSWORD=... psql -h localhost -U postgres -d postgres -f schema.sql
-- Déploiement : docker exec supabase-db psql -U postgres -d postgres -f /tmp/schema.sql

CREATE SCHEMA IF NOT EXISTS vida_assoc;
SET search_path = vida_assoc, public;

-- Extensions (public namespace)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- PROFILES
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  lang text DEFAULT 'fr',
  country text,
  region text,
  city text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','association','enterprise','ong','super_admin')),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','one','premium')),
  subscription_interval text CHECK (subscription_interval IN ('monthly','yearly') OR subscription_interval IS NULL),
  trial_ends_at timestamptz,
  paused_at timestamptz,
  -- Stripe
  stripe_customer_id text,
  stripe_subscription_id text,
  -- Compteurs
  vida_credits integer NOT NULL DEFAULT 100, -- bonus inscription : 100 crédits
  impact_score integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  total_missions_completed integer NOT NULL DEFAULT 0,
  total_donated_cents integer NOT NULL DEFAULT 0,
  total_earned_cents integer NOT NULL DEFAULT 0,
  wallet_balance_cents integer NOT NULL DEFAULT 0,
  contest_tickets integer NOT NULL DEFAULT 0,
  consciousness_level text DEFAULT 'Graine',
  -- Accessibilité
  is_handicap boolean NOT NULL DEFAULT false,
  handicap_type text, -- visuel | auditif | moteur | cognitif | multiple
  accessibility_mode text DEFAULT 'standard' CHECK (accessibility_mode IN ('standard','visuel','auditif','moteur','enfant','senior')),
  multisensorial_enabled boolean NOT NULL DEFAULT true,
  notification_mode text DEFAULT 'normal' CHECK (notification_mode IN ('zen','normal','actif','silencieux')),
  theme text DEFAULT 'dark' CHECK (theme IN ('dark','light','oled','auto')),
  -- Parrainage
  referral_code text UNIQUE,
  referred_by uuid REFERENCES vida_assoc.profiles(id) ON DELETE SET NULL,
  -- Misc
  tutorial_completed boolean NOT NULL DEFAULT false,
  onboarded boolean NOT NULL DEFAULT false,
  iban text, -- chiffré côté app
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotence webhook Stripe : empeche un event redeliverre par Stripe/karma
-- de re-executer le handler (double-credit asso/prime, cf task_plan.md P3).
CREATE TABLE IF NOT EXISTS vida_assoc.stripe_events (
  event_id TEXT PRIMARY KEY,
  type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON vida_assoc.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON vida_assoc.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON vida_assoc.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON vida_assoc.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON vida_assoc.profiles(plan);

-- =========================================================================
-- ASSOCIATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  vida_name text, -- ex : "VIDA + Restos du Cœur"
  logo_url text,
  cover_url text,
  description text,
  mission_statement text,
  category text, -- humanitaire | environnement | santé | éducation | animaux | etc
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES vida_assoc.profiles(id),
  country text,
  region text,
  city text,
  website text,
  contact_email text,
  contact_phone text,
  siret text,
  rna text, -- RNA FR associations
  impact_score integer NOT NULL DEFAULT 0,
  missions_count integer NOT NULL DEFAULT 0,
  donations_received_cents integer NOT NULL DEFAULT 0,
  volunteers_count integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  stripe_account_id text, -- Stripe Connect pour versement direct
  balance_cents integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_associations_slug ON vida_assoc.associations(slug);
CREATE INDEX IF NOT EXISTS idx_associations_verified ON vida_assoc.associations(verified);
CREATE INDEX IF NOT EXISTS idx_associations_country ON vida_assoc.associations(country);
CREATE INDEX IF NOT EXISTS idx_associations_impact ON vida_assoc.associations(impact_score DESC);

CREATE TABLE IF NOT EXISTS vida_assoc.association_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES vida_assoc.associations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','admin','owner')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(association_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_asso_members_user ON vida_assoc.association_members(user_id);

-- =========================================================================
-- MISSIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('environment','social','digital','wellness','spiritual','education','food','donation','publicity','sport','rangement','garde','animaux','soin','jeune','formation','other')),
  category_id text NOT NULL,
  creator_type text NOT NULL CHECK (creator_type IN ('vida','association','enterprise','ong','user')),
  creator_id uuid, -- user ou association selon creator_type
  association_id uuid REFERENCES vida_assoc.associations(id) ON DELETE SET NULL,
  -- Récompense
  reward_type text NOT NULL CHECK (reward_type IN ('money','vida_credits','promo','contest_tickets','mixed')),
  reward_amount_cents integer NOT NULL DEFAULT 0, -- argent réel en centimes
  reward_vida_credits integer NOT NULL DEFAULT 0,
  reward_contest_tickets integer NOT NULL DEFAULT 0,
  reward_promo_percent integer NOT NULL DEFAULT 0,
  -- Escrow : pour missions particuliers
  escrow_locked_cents integer NOT NULL DEFAULT 0,
  escrow_released boolean NOT NULL DEFAULT false,
  -- Localisation
  location_lat double precision,
  location_lng double precision,
  location_name text,
  location_radius_km integer DEFAULT 5,
  -- Contraintes
  duration_minutes integer,
  max_participants integer NOT NULL DEFAULT 1,
  current_participants integer NOT NULL DEFAULT 0,
  difficulty text CHECK (difficulty IN ('facile','moyen','difficile','expert')),
  -- Preuves
  verification_method text NOT NULL DEFAULT 'photo' CHECK (verification_method IN ('photo','video','photo_before_after','gps','ai_auto','mutual_confirmation','exif','qr','health')),
  proof_required boolean NOT NULL DEFAULT true,
  -- Etat
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','paused','completed','cancelled','expired','pending_review')),
  is_collective boolean NOT NULL DEFAULT false,
  is_sponsored boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  -- Meta
  image_url text,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_missions_status ON vida_assoc.missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_type ON vida_assoc.missions(type);
CREATE INDEX IF NOT EXISTS idx_missions_creator ON vida_assoc.missions(creator_type, creator_id);
CREATE INDEX IF NOT EXISTS idx_missions_location ON vida_assoc.missions(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_missions_created ON vida_assoc.missions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_missions_category ON vida_assoc.missions(category_id);

-- Complétions / preuves
CREATE TABLE IF NOT EXISTS vida_assoc.mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES vida_assoc.missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','validated','rejected','disputed')),
  proof_photo_url text,
  proof_photo_before_url text,
  proof_photo_after_url text,
  proof_video_url text,
  proof_gps_lat double precision,
  proof_gps_lng double precision,
  proof_exif_data jsonb,
  proof_text text,
  ai_validation_score numeric(4,3), -- 0.000-1.000
  ai_validation_notes text,
  human_review_needed boolean NOT NULL DEFAULT false,
  reviewed_by uuid REFERENCES vida_assoc.profiles(id),
  validated_at timestamptz,
  reward_paid boolean NOT NULL DEFAULT false,
  reward_paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mission_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_completions_user ON vida_assoc.mission_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_mission ON vida_assoc.mission_completions(mission_id);
CREATE INDEX IF NOT EXISTS idx_completions_status ON vida_assoc.mission_completions(status);

-- Quêtes quotidiennes
CREATE TABLE IF NOT EXISTS vida_assoc.daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  missions_required integer NOT NULL DEFAULT 3,
  missions_completed integer NOT NULL DEFAULT 0,
  reward_vida_credits integer NOT NULL DEFAULT 100,
  reward_contest_tickets integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON vida_assoc.daily_quests(user_id, date DESC);

-- =========================================================================
-- DONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES vida_assoc.profiles(id) ON DELETE SET NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('association','vida','project','user')),
  recipient_id uuid,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  payment_method text CHECK (payment_method IN ('card','apple_pay','google_pay','paypal','sepa','vida_credits')),
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_interval text CHECK (recurring_interval IN ('weekly','monthly','yearly') OR recurring_interval IS NULL),
  round_up_enabled boolean NOT NULL DEFAULT false,
  round_up_amount_cents integer DEFAULT 0,
  vida_commission_percent numeric(5,2) NOT NULL DEFAULT 0,
  vida_commission_cents integer NOT NULL DEFAULT 0,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
  anonymous boolean NOT NULL DEFAULT false,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON vida_assoc.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_recipient ON vida_assoc.donations(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON vida_assoc.donations(status);

CREATE TABLE IF NOT EXISTS vida_assoc.donation_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  interval text NOT NULL DEFAULT 'monthly' CHECK (interval IN ('weekly','monthly','yearly')),
  recipient_type text NOT NULL CHECK (recipient_type IN ('association','vida','project')),
  recipient_id uuid,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_donation_subs_user ON vida_assoc.donation_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS vida_assoc.material_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  item_description text NOT NULL,
  item_photo_url text,
  category text, -- vêtements, meubles, nourriture, livres, électronique
  quantity integer DEFAULT 1,
  recipient_association_id uuid REFERENCES vida_assoc.associations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','picked_up','delivered','cancelled')),
  pickup_location text,
  pickup_lat double precision,
  pickup_lng double precision,
  pickup_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- ABONNEMENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('one','premium')),
  interval text NOT NULL CHECK (interval IN ('monthly','yearly')),
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','cancelled','paused','incomplete')),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  paused_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON vida_assoc.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON vida_assoc.subscriptions(status);

-- Factures
CREATE TABLE IF NOT EXISTS vida_assoc.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  number text NOT NULL UNIQUE,
  subscription_id uuid REFERENCES vida_assoc.subscriptions(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  pdf_url text,
  stripe_invoice_id text,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('draft','open','paid','uncollectible','void')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON vida_assoc.invoices(user_id);

-- =========================================================================
-- PARRAINAGE
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','converted','active','churned')),
  first_subscription_earned_cents integer NOT NULL DEFAULT 0,
  lifetime_earned_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  UNIQUE(referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON vida_assoc.referrals(referrer_id);

CREATE TABLE IF NOT EXISTS vida_assoc.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES vida_assoc.referrals(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  commission_type text NOT NULL CHECK (commission_type IN ('first_subscription','recurring','cross_app','bonus')),
  source_type text, -- subscription | mission | donation | purchase
  source_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON vida_assoc.referral_commissions(referrer_id);

-- =========================================================================
-- INFLUENCEURS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  promo_code text NOT NULL UNIQUE,
  promo_link text NOT NULL,
  promo_expiry_days integer NOT NULL DEFAULT 7,
  commission_first_percent numeric(5,2) NOT NULL DEFAULT 50,
  commission_recurring_percent numeric(5,2) NOT NULL DEFAULT 10,
  discount_percent numeric(5,2) NOT NULL DEFAULT 50, -- -50% via lien
  bio text,
  social_links jsonb DEFAULT '{}'::jsonb,
  approved boolean NOT NULL DEFAULT true,
  total_clicks integer NOT NULL DEFAULT 0,
  total_conversions integer NOT NULL DEFAULT 0,
  total_earned_cents integer NOT NULL DEFAULT 0,
  dashboard_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_influencers_code ON vida_assoc.influencers(promo_code);

CREATE TABLE IF NOT EXISTS vida_assoc.influencer_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES vida_assoc.influencers(id) ON DELETE CASCADE,
  ip_hash text,
  referer text,
  user_agent text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inf_clicks_inf ON vida_assoc.influencer_clicks(influencer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS vida_assoc.influencer_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES vida_assoc.influencers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES vida_assoc.subscriptions(id) ON DELETE SET NULL,
  commission_amount_cents integer NOT NULL,
  commission_type text NOT NULL CHECK (commission_type IN ('first','recurring')),
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inf_sales_inf ON vida_assoc.influencer_sales(influencer_id);

-- =========================================================================
-- IMPACT & SUIVI
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.impact_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  mission_id uuid REFERENCES vida_assoc.missions(id) ON DELETE SET NULL,
  impact_type text NOT NULL CHECK (impact_type IN ('co2_saved_kg','waste_collected_kg','water_protected_l','trees_planted','people_helped','meals_distributed','hours_volunteered','money_donated_cents','animals_helped','energy_saved_kwh')),
  impact_value numeric(14,3) NOT NULL,
  impact_unit text,
  equivalent_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_impact_user ON vida_assoc.impact_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_type ON vida_assoc.impact_tracker(impact_type);

CREATE TABLE IF NOT EXISTS vida_assoc.impact_global (
  date date PRIMARY KEY DEFAULT CURRENT_DATE,
  total_co2_kg numeric(14,3) NOT NULL DEFAULT 0,
  total_waste_kg numeric(14,3) NOT NULL DEFAULT 0,
  total_water_l numeric(14,3) NOT NULL DEFAULT 0,
  total_trees integer NOT NULL DEFAULT 0,
  total_people_helped integer NOT NULL DEFAULT 0,
  total_meals integer NOT NULL DEFAULT 0,
  total_hours_volunteered numeric(14,2) NOT NULL DEFAULT 0,
  total_missions integer NOT NULL DEFAULT 0,
  total_users integer NOT NULL DEFAULT 0,
  total_donated_cents bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_assoc.map_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  mission_id uuid REFERENCES vida_assoc.missions(id) ON DELETE SET NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  action_type text NOT NULL,
  impact_description text,
  photo_url text,
  visible_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_map_actions_location ON vida_assoc.map_actions(lat, lng);

-- =========================================================================
-- CLASSEMENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL CHECK (period IN ('daily','weekly','monthly','yearly','alltime')),
  scope text NOT NULL CHECK (scope IN ('global','country','region','department','city')),
  scope_value text, -- ex: 'FR', 'Bourgogne-Franche-Comté'
  category text NOT NULL CHECK (category IN ('missions','donations','impact','referrals','volunteers')),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  score numeric(14,3) NOT NULL DEFAULT 0,
  rank integer,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(period, scope, scope_value, category, user_id, period_start)
);
CREATE INDEX IF NOT EXISTS idx_leaderboards_lookup ON vida_assoc.leaderboards(period, scope, scope_value, category, score DESC);

-- =========================================================================
-- CONCOURS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('weekly','monthly','yearly','special')),
  prizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_pool_cents integer NOT NULL DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  entry_method text NOT NULL DEFAULT 'missions' CHECK (entry_method IN ('missions','subscription','donations','purchases','automatic')),
  max_entries_per_user integer,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','completed','cancelled')),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contests_status ON vida_assoc.contests(status);

CREATE TABLE IF NOT EXISTS vida_assoc.contest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES vida_assoc.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  tickets_used integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contest_entries ON vida_assoc.contest_entries(contest_id, user_id);

CREATE TABLE IF NOT EXISTS vida_assoc.contest_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES vida_assoc.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  prize_description text,
  prize_value_cents integer NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- RITUELS COLLECTIFS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('pleine_lune','portail_energetique','depollution','paix','amour','pardon','gratitude','abondance','soin_collectif')),
  intention text NOT NULL,
  guided_steps jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{step:1, title:"Respiration", duration_min:5, audio_url:"..."}]
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 20,
  participants_count integer NOT NULL DEFAULT 0,
  impact_target integer,
  reward_vida_credits integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','completed')),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rituals_scheduled ON vida_assoc.rituals(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_rituals_status ON vida_assoc.rituals(status);

CREATE TABLE IF NOT EXISTS vida_assoc.ritual_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id uuid NOT NULL REFERENCES vida_assoc.rituals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  reward_vida_credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ritual_id, user_id)
);

-- =========================================================================
-- PRODUITS MARKETPLACE
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  category text NOT NULL CHECK (category IN ('bracelet','soin','formation','purificateur_eau','jardin','livre','telephone','autre')),
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,
  stock integer NOT NULL DEFAULT -1, -- -1 = illimité
  vida_cashback_percent numeric(5,2) NOT NULL DEFAULT 5,
  featured boolean NOT NULL DEFAULT false,
  external_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','sold_out','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON vida_assoc.products(category);

CREATE TABLE IF NOT EXISTS vida_assoc.product_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES vida_assoc.products(id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL,
  cashback_vida_credits integer NOT NULL DEFAULT 0,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- FORMATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('video','livre','papier','audio','interactive')),
  target_audience text NOT NULL CHECK (target_audience IN ('adulte','enfant','handicap_visuel','handicap_auditif','handicap_moteur','senior','tous')),
  format text, -- mp4, pdf, epub, …
  duration_minutes integer,
  modules jsonb DEFAULT '[]'::jsonb, -- [{id, title, duration, content_url}]
  content_url text,
  thumbnail_url text,
  is_free boolean NOT NULL DEFAULT true,
  price_cents integer NOT NULL DEFAULT 0,
  required_plan text CHECK (required_plan IN ('free','one','premium') OR required_plan IS NULL),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_formations_audience ON vida_assoc.formations(target_audience);

CREATE TABLE IF NOT EXISTS vida_assoc.formation_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  formation_id uuid NOT NULL REFERENCES vida_assoc.formations(id) ON DELETE CASCADE,
  percent_complete integer NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  completed_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, formation_id)
);

-- =========================================================================
-- PUB INTERNE
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.user_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  target_url text NOT NULL,
  budget_vida_credits integer NOT NULL DEFAULT 0,
  spent_vida_credits integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft','pending_review','active','paused','completed','rejected')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz
);

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_mission','ritual','contest','reward','impact','donation','referral','streak','system','community','influencer','level_up')),
  title text NOT NULL,
  body text,
  action_url text,
  icon text,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON vida_assoc.notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS vida_assoc.notification_settings (
  user_id uuid PRIMARY KEY REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'normal' CHECK (mode IN ('zen','normal','actif','silencieux')),
  quiet_hours_start time DEFAULT '20:00',
  quiet_hours_end time DEFAULT '09:00',
  custom_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- COMMUNAUTÉ MINI
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  media_url text,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text','photo','video','mission','victory','question','gratitude')),
  mission_id uuid REFERENCES vida_assoc.missions(id) ON DELETE SET NULL,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_created ON vida_assoc.community_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS vida_assoc.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES vida_assoc.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_assoc.community_likes (
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES vida_assoc.community_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS vida_assoc.meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  lat double precision,
  lng double precision,
  date timestamptz NOT NULL,
  max_participants integer DEFAULT 20,
  current_participants integer NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('pratique_ensemble','rencontre','mission_groupe','rituel')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_assoc.meetup_participants (
  meetup_id uuid NOT NULL REFERENCES vida_assoc.meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meetup_id, user_id)
);

-- =========================================================================
-- IA VIDA — CONVERSATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON vida_assoc.conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS vida_assoc.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES vida_assoc.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON vida_assoc.messages(conversation_id, created_at);

-- =========================================================================
-- FONDS REDISTRIBUTION
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.monthly_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  total_revenue_cents bigint NOT NULL DEFAULT 0,
  redistribution_percent numeric(5,2) NOT NULL DEFAULT 50,
  fund_amount_cents bigint NOT NULL DEFAULT 0,
  distributed boolean NOT NULL DEFAULT false,
  distributed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS vida_assoc.fund_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES vida_assoc.monthly_funds(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('association','user','enterprise')),
  recipient_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  reason text,
  impact_score_snapshot integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- RETRAITS WALLET
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents >= 500),
  iban text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  failure_reason text
);

CREATE TABLE IF NOT EXISTS vida_assoc.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL, -- positif = entrée, négatif = sortie
  currency text NOT NULL DEFAULT 'EUR',
  type text NOT NULL CHECK (type IN ('mission_reward','referral_commission','contest_prize','influencer_commission','withdrawal','refund','bonus','fund_distribution')),
  source_id uuid,
  description text,
  balance_after_cents integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON vida_assoc.wallet_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS vida_assoc.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vida_assoc.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positif = gain, négatif = dépense
  type text NOT NULL CHECK (type IN ('signup','mission','ritual','daily_quest','referral','streak','purchase_cashback','ad_spend','redeem','admin_adjust','level_up')),
  source_id uuid,
  description text,
  balance_after integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON vida_assoc.credit_transactions(user_id, created_at DESC);

-- =========================================================================
-- ADMIN STATS
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.admin_stats (
  date date PRIMARY KEY DEFAULT CURRENT_DATE,
  total_users integer NOT NULL DEFAULT 0,
  new_users_today integer NOT NULL DEFAULT 0,
  active_users_today integer NOT NULL DEFAULT 0,
  total_subscriptions integer NOT NULL DEFAULT 0,
  total_revenue_cents bigint NOT NULL DEFAULT 0,
  total_missions_completed integer NOT NULL DEFAULT 0,
  total_donations_cents bigint NOT NULL DEFAULT 0,
  total_impact_score bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- FAQ / AIDE
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.faq_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  search_keywords text,
  view_count integer NOT NULL DEFAULT 0,
  helpful_count integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_assoc.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  user_id uuid REFERENCES vida_assoc.profiles(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  responded boolean NOT NULL DEFAULT false,
  responded_at timestamptz
);

-- =========================================================================
-- AUDIT LOG
-- =========================================================================
CREATE TABLE IF NOT EXISTS vida_assoc.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES vida_assoc.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- FUNCTIONS & TRIGGERS
-- =========================================================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION vida_assoc.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name FROM information_schema.columns
           WHERE table_schema='vida_assoc' AND column_name='updated_at'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON vida_assoc.%I;
       CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON vida_assoc.%I
       FOR EACH ROW EXECUTE FUNCTION vida_assoc.set_updated_at();',
      r.table_name, r.table_name, r.table_name, r.table_name);
  END LOOP;
END;
$$;

-- Fonction : générer un code parrainage unique
CREATE OR REPLACE FUNCTION vida_assoc.generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists_count int;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT count(*) INTO exists_count FROM vida_assoc.profiles WHERE referral_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Fonction : auto-créer le profil à la création d'un user auth
CREATE OR REPLACE FUNCTION vida_assoc.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_super boolean;
  ref_code text;
  ref_parent uuid;
BEGIN
  is_super := (NEW.email = 'matiss.frasne@gmail.com');
  ref_code := vida_assoc.generate_referral_code();
  -- Parrainage via metadata signup
  IF NEW.raw_user_meta_data ? 'referral_code' THEN
    SELECT id INTO ref_parent FROM vida_assoc.profiles
      WHERE referral_code = NEW.raw_user_meta_data->>'referral_code' LIMIT 1;
  END IF;
  INSERT INTO vida_assoc.profiles (id, email, full_name, avatar_url, role, plan, referral_code, referred_by, vida_credits, contest_tickets)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN is_super THEN 'super_admin' ELSE 'user' END,
    CASE WHEN is_super THEN 'premium' ELSE 'free' END,
    ref_code,
    ref_parent,
    100, -- bonus signup
    1    -- ticket concours inscription
  )
  ON CONFLICT (id) DO NOTHING;

  -- Crédit de bienvenue
  INSERT INTO vida_assoc.credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (NEW.id, 100, 'signup', 'Bonus inscription VIDA', 100);

  -- Enregistrer la relation de parrainage
  IF ref_parent IS NOT NULL THEN
    INSERT INTO vida_assoc.referrals (referrer_id, referred_id, referral_code, status)
    VALUES (ref_parent, NEW.id, NEW.raw_user_meta_data->>'referral_code', 'pending');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION vida_assoc.handle_new_user();

-- =========================================================================
-- RLS POLICIES
-- =========================================================================
ALTER TABLE vida_assoc.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.donation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.material_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.influencer_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.influencer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.impact_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.impact_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.map_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.contest_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.ritual_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.product_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.formation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.user_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.meetup_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.monthly_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.fund_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.admin_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_assoc.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper : user authentifié
-- auth.uid() retourne l'UUID du user courant (null si anonyme)

DO $$
BEGIN
  -- profiles : user peut lire son propre profil et ceux publics (list)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='profiles' AND policyname='profiles_read_own') THEN
    CREATE POLICY profiles_read_own ON vida_assoc.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='profiles' AND policyname='profiles_read_public') THEN
    CREATE POLICY profiles_read_public ON vida_assoc.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='profiles' AND policyname='profiles_update_own') THEN
    CREATE POLICY profiles_update_own ON vida_assoc.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;

  -- associations : lecture publique, écriture par member admin
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='associations' AND policyname='associations_read_all') THEN
    CREATE POLICY associations_read_all ON vida_assoc.associations FOR SELECT USING (true);
  END IF;

  -- missions : lecture publique si active
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='missions' AND policyname='missions_read_public') THEN
    CREATE POLICY missions_read_public ON vida_assoc.missions FOR SELECT USING (is_public = true OR creator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='missions' AND policyname='missions_insert_auth') THEN
    CREATE POLICY missions_insert_auth ON vida_assoc.missions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='missions' AND policyname='missions_update_own') THEN
    CREATE POLICY missions_update_own ON vida_assoc.missions FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
  END IF;

  -- mission_completions : user peut voir les siennes, insérer
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='mission_completions' AND policyname='completions_read_own') THEN
    CREATE POLICY completions_read_own ON vida_assoc.mission_completions FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='mission_completions' AND policyname='completions_insert_own') THEN
    CREATE POLICY completions_insert_own ON vida_assoc.mission_completions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  -- daily_quests : own only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='daily_quests' AND policyname='dq_own') THEN
    CREATE POLICY dq_own ON vida_assoc.daily_quests FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- donations : own or anonymous public
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='donations' AND policyname='donations_read_own') THEN
    CREATE POLICY donations_read_own ON vida_assoc.donations FOR SELECT USING (donor_id = auth.uid() OR anonymous = false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='donations' AND policyname='donations_insert_own') THEN
    CREATE POLICY donations_insert_own ON vida_assoc.donations FOR INSERT WITH CHECK (donor_id = auth.uid());
  END IF;

  -- subscriptions : own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='subscriptions' AND policyname='subs_own') THEN
    CREATE POLICY subs_own ON vida_assoc.subscriptions FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- invoices : own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='invoices' AND policyname='invoices_own') THEN
    CREATE POLICY invoices_own ON vida_assoc.invoices FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- referrals : as referrer or referred
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='referrals' AND policyname='referrals_read') THEN
    CREATE POLICY referrals_read ON vida_assoc.referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());
  END IF;

  -- referral_commissions : own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='referral_commissions' AND policyname='rc_own') THEN
    CREATE POLICY rc_own ON vida_assoc.referral_commissions FOR SELECT USING (referrer_id = auth.uid());
  END IF;

  -- influencers : own read/write, public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='influencers' AND policyname='inf_read_public') THEN
    CREATE POLICY inf_read_public ON vida_assoc.influencers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='influencers' AND policyname='inf_insert_own') THEN
    CREATE POLICY inf_insert_own ON vida_assoc.influencers FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='influencers' AND policyname='inf_update_own') THEN
    CREATE POLICY inf_update_own ON vida_assoc.influencers FOR UPDATE USING (user_id = auth.uid());
  END IF;

  -- influencer_sales : own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='influencer_sales' AND policyname='inf_sales_own') THEN
    CREATE POLICY inf_sales_own ON vida_assoc.influencer_sales FOR SELECT
      USING (influencer_id IN (SELECT id FROM vida_assoc.influencers WHERE user_id = auth.uid()));
  END IF;

  -- impact_tracker : own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='impact_tracker' AND policyname='impact_own') THEN
    CREATE POLICY impact_own ON vida_assoc.impact_tracker FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- impact_global : public
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='impact_global' AND policyname='ig_public') THEN
    CREATE POLICY ig_public ON vida_assoc.impact_global FOR SELECT USING (true);
  END IF;

  -- map_actions : public si visible
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='map_actions' AND policyname='map_public') THEN
    CREATE POLICY map_public ON vida_assoc.map_actions FOR SELECT USING (visible_public = true OR user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='map_actions' AND policyname='map_insert_own') THEN
    CREATE POLICY map_insert_own ON vida_assoc.map_actions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  -- leaderboards : public
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='leaderboards' AND policyname='lb_public') THEN
    CREATE POLICY lb_public ON vida_assoc.leaderboards FOR SELECT USING (true);
  END IF;

  -- contests : public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='contests' AND policyname='contests_public') THEN
    CREATE POLICY contests_public ON vida_assoc.contests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='contest_entries' AND policyname='ce_own') THEN
    CREATE POLICY ce_own ON vida_assoc.contest_entries FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='contest_winners' AND policyname='cw_public') THEN
    CREATE POLICY cw_public ON vida_assoc.contest_winners FOR SELECT USING (true);
  END IF;

  -- rituels : public read, own participation
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='rituals' AND policyname='rituals_public') THEN
    CREATE POLICY rituals_public ON vida_assoc.rituals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='ritual_participations' AND policyname='rp_own') THEN
    CREATE POLICY rp_own ON vida_assoc.ritual_participations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- products : public
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='products' AND policyname='products_public') THEN
    CREATE POLICY products_public ON vida_assoc.products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='product_purchases' AND policyname='pp_own') THEN
    CREATE POLICY pp_own ON vida_assoc.product_purchases FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- formations : public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='formations' AND policyname='form_public') THEN
    CREATE POLICY form_public ON vida_assoc.formations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='formation_progress' AND policyname='fp_own') THEN
    CREATE POLICY fp_own ON vida_assoc.formation_progress FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- user_ads : public read when active, own write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='user_ads' AND policyname='ads_public') THEN
    CREATE POLICY ads_public ON vida_assoc.user_ads FOR SELECT USING (status = 'active' OR user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='user_ads' AND policyname='ads_own_write') THEN
    CREATE POLICY ads_own_write ON vida_assoc.user_ads FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  -- notifications : own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='notifications' AND policyname='notif_own') THEN
    CREATE POLICY notif_own ON vida_assoc.notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='notification_settings' AND policyname='ns_own') THEN
    CREATE POLICY ns_own ON vida_assoc.notification_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- community : public read, own write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='community_posts' AND policyname='cp_public') THEN
    CREATE POLICY cp_public ON vida_assoc.community_posts FOR SELECT USING (hidden = false OR user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='community_posts' AND policyname='cp_insert_own') THEN
    CREATE POLICY cp_insert_own ON vida_assoc.community_posts FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='community_comments' AND policyname='cc_public') THEN
    CREATE POLICY cc_public ON vida_assoc.community_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='community_comments' AND policyname='cc_insert_own') THEN
    CREATE POLICY cc_insert_own ON vida_assoc.community_comments FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='community_likes' AND policyname='cl_own') THEN
    CREATE POLICY cl_own ON vida_assoc.community_likes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='meetups' AND policyname='meetups_public') THEN
    CREATE POLICY meetups_public ON vida_assoc.meetups FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='meetups' AND policyname='meetups_insert_own') THEN
    CREATE POLICY meetups_insert_own ON vida_assoc.meetups FOR INSERT WITH CHECK (creator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='meetup_participants' AND policyname='mp_own') THEN
    CREATE POLICY mp_own ON vida_assoc.meetup_participants FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- conversations & messages : own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='conversations' AND policyname='conv_own') THEN
    CREATE POLICY conv_own ON vida_assoc.conversations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='messages' AND policyname='msg_own') THEN
    CREATE POLICY msg_own ON vida_assoc.messages FOR ALL
      USING (conversation_id IN (SELECT id FROM vida_assoc.conversations WHERE user_id = auth.uid()))
      WITH CHECK (conversation_id IN (SELECT id FROM vida_assoc.conversations WHERE user_id = auth.uid()));
  END IF;

  -- wallet & credits : read own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='wallet_transactions' AND policyname='wt_own') THEN
    CREATE POLICY wt_own ON vida_assoc.wallet_transactions FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='credit_transactions' AND policyname='ct_own') THEN
    CREATE POLICY ct_own ON vida_assoc.credit_transactions FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='withdrawals' AND policyname='wd_own') THEN
    CREATE POLICY wd_own ON vida_assoc.withdrawals FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- FAQ public
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='faq_articles' AND policyname='faq_public') THEN
    CREATE POLICY faq_public ON vida_assoc.faq_articles FOR SELECT USING (true);
  END IF;
  -- contact : insert open
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='contact_messages' AND policyname='contact_insert') THEN
    CREATE POLICY contact_insert ON vida_assoc.contact_messages FOR INSERT WITH CHECK (true);
  END IF;
END;
$$;

-- Réconciliation wallet ↔ Stripe (cron /api/cron/reconcile, alerte-only,
-- 0 correction automatique)
CREATE TABLE IF NOT EXISTS vida_assoc.reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  invoices_without_prime INTEGER NOT NULL DEFAULT 0,
  referral_commission_mismatches INTEGER NOT NULL DEFAULT 0,
  wallet_ledger_mismatches INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE vida_assoc.reconciliation_reports ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_assoc' AND tablename='reconciliation_reports') THEN
    CREATE POLICY "service role reconciliation_reports" ON vida_assoc.reconciliation_reports FOR ALL TO service_role USING (TRUE);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_run_at ON vida_assoc.reconciliation_reports(run_at DESC);

-- Permissions schema
GRANT USAGE ON SCHEMA vida_assoc TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA vida_assoc TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA vida_assoc TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA vida_assoc TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA vida_assoc TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA vida_assoc GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA vida_assoc GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA vida_assoc GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- =========================================================================
-- SEEDS (données minimales réelles)
-- =========================================================================
-- Impact global j0
INSERT INTO vida_assoc.impact_global (date) VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

-- Associations réelles francophones vérifiées (exemples légaux publics)
INSERT INTO vida_assoc.associations (slug, name, vida_name, description, category, verified, country, website, impact_score, featured) VALUES
('purama', 'Association PURAMA', 'VIDA x PURAMA', 'Association fondatrice de l''écosystème VIDA. Soutient missions mondiales, formations, et redistribution mensuelle.', 'humanitaire', true, 'FR', 'https://purama.dev', 10000, true),
('restos-du-coeur', 'Les Restos du Cœur', 'VIDA + Restos du Cœur', 'Aide alimentaire et accompagnement des plus démunis depuis 1985. Repas chauds, épicerie sociale, insertion.', 'humanitaire', true, 'FR', 'https://restosducoeur.org', 9500, true),
('secours-populaire', 'Secours Populaire Français', 'VIDA + Secours Populaire', 'Solidarité en France et dans le monde. Aide alimentaire, vestimentaire, vacances, culture.', 'humanitaire', true, 'FR', 'https://secourspopulaire.fr', 9400, true),
('wwf-france', 'WWF France', 'VIDA + WWF', 'Protection de la nature et des espèces menacées. Reforestation, biodiversité, climat.', 'environnement', true, 'FR', 'https://wwf.fr', 9700, true),
('sea-shepherd', 'Sea Shepherd France', 'VIDA + Sea Shepherd', 'Protection directe de la vie marine mondiale.', 'environnement', true, 'FR', 'https://seashepherd.fr', 8800, false),
('emmaus', 'Emmaüs France', 'VIDA + Emmaüs', 'Lutte contre la pauvreté et l''exclusion par le réemploi et l''accueil inconditionnel.', 'humanitaire', true, 'FR', 'https://emmaus-france.org', 9300, false),
('croix-rouge', 'Croix-Rouge française', 'VIDA + Croix-Rouge', 'Urgence, secours, formation aux gestes qui sauvent, aide sociale.', 'sante', true, 'FR', 'https://croix-rouge.fr', 9600, true),
('unicef-france', 'UNICEF France', 'VIDA + UNICEF', 'Protection des droits de l''enfant dans le monde.', 'enfance', true, 'FR', 'https://unicef.fr', 9500, false),
('handicap-international', 'Handicap International', 'VIDA + Handicap International', 'Aide aux personnes handicapées et populations vulnérables dans 60 pays.', 'sante', true, 'FR', 'https://hi.org', 9200, false),
('amnesty-international-france', 'Amnesty International France', 'VIDA + Amnesty', 'Défense des droits humains dans le monde entier.', 'humanitaire', true, 'FR', 'https://amnesty.fr', 9100, false),
('greenpeace-france', 'Greenpeace France', 'VIDA + Greenpeace', 'Protection de l''environnement et actions non-violentes pour la planète.', 'environnement', true, 'FR', 'https://greenpeace.fr', 9400, true),
('spa', 'Société Protectrice des Animaux', 'VIDA + SPA', 'Protection et défense des animaux depuis 1845. Refuges, adoptions, lutte contre la maltraitance.', 'animaux', true, 'FR', 'https://la-spa.fr', 9000, false),
('medecins-sans-frontieres', 'Médecins Sans Frontières', 'VIDA + MSF', 'Aide médicale d''urgence aux populations en crise.', 'sante', true, 'FR', 'https://msf.fr', 9800, true),
('action-contre-la-faim', 'Action contre la Faim', 'VIDA + Action contre la Faim', 'Lutte contre la faim dans le monde : nutrition, eau, sécurité alimentaire.', 'humanitaire', true, 'FR', 'https://actioncontrelafaim.org', 9300, false),
('unis-cite', 'Unis-Cité', 'VIDA + Unis-Cité', 'Service civique solidaire pour les jeunes.', 'jeunesse', true, 'FR', 'https://uniscite.fr', 8500, false)
ON CONFLICT (slug) DO NOTHING;

-- Missions VIDA pré-créées (exemples réalistes couvrant plusieurs catégories)
INSERT INTO vida_assoc.missions (title, description, type, category_id, creator_type, reward_type, reward_vida_credits, reward_contest_tickets, duration_minutes, max_participants, difficulty, verification_method, is_collective, is_public, tags, status) VALUES
('Ramasser 20 déchets en marchant', 'Choisis un trajet que tu fais déjà et ramasse 20 déchets au passage. Photo avant, photo après, tu valides. Mission idéale en 15 minutes.', 'environment','depollution','vida','mixed', 150, 2, 30, 1000, 'facile','photo_before_after', false, true, ARRAY['déchets','facile','15min'], 'active'),
('Planter une graine chez toi', 'Installe une graine dans un pot ou au jardin. Photo du setup, mise à jour à la pousse. Au fur et à mesure tu reçois des crédits.', 'environment','plantation','vida','vida_credits', 200, 1, 20, 10000, 'facile','photo', false, true, ARRAY['plante','domicile'], 'active'),
('Appeler un proche isolé', 'Passe 15 minutes à appeler un grand-parent, voisin ou ami isolé. Preuve : petit message écrit décrivant la discussion (anonymisé).', 'social','compagnie_seniors','vida','vida_credits', 100, 1, 15, 5000, 'facile','photo', false, true, ARRAY['solidarité','proche'], 'active'),
('Méditation VIDA 20 min', 'Méditation guidée avec VIDA. Respiration consciente, intention positive. Capteurs possibles via Apple Health.', 'wellness','meditation','vida','vida_credits', 120, 1, 20, 100000, 'facile','health', false, true, ARRAY['méditation','bien-être'], 'active'),
('Marcher 5 km dans la nature', 'Marche dans un parc ou une forêt. Preuve GPS + photo d''un arbre.', 'wellness','marche_nature','vida','vida_credits', 180, 1, 60, 100000, 'facile','gps', false, true, ARRAY['sport','nature'], 'active'),
('Partager une story VIDA', 'Crée une story (Insta/Snap/TikTok) avec ton lien de parrainage. L''IA vérifie que le lien y est.', 'publicity','parrainage_story','vida','vida_credits', 300, 2, 5, 100000, 'facile','ai_auto', false, true, ARRAY['pub','viral'], 'active'),
('Cuisiner pour un proche', 'Prépare un repas et partage-le avec quelqu''un qui en a besoin. Photo du plat.', 'food','cuisine_solidaire','vida','vida_credits', 250, 1, 60, 50000, 'facile','photo', false, true, ARRAY['cuisine','solidarité'], 'active'),
('Rituel collectif hebdomadaire', 'Rejoins le rituel VIDA de la semaine, 20 min, intention mondiale partagée.', 'spiritual','rituel_collectif','vida','vida_credits', 200, 3, 20, 1000000, 'facile','mutual_confirmation', true, true, ARRAY['rituel','collectif'], 'active'),
('Ranger une pièce de chez toi', 'Photo avant, photo après. L''IA compare et valide le changement.', 'wellness','rangement_maison','vida','vida_credits', 150, 1, 45, 100000, 'facile','photo_before_after', false, true, ARRAY['maison','facile'], 'active'),
('Lire 30 min un livre inspirant', 'Lis 30 min un livre choisi par VIDA (pure / amour / puissance). Résumé court en fin.', 'education','formation','vida','vida_credits', 200, 1, 30, 100000, 'facile','photo', false, true, ARRAY['lecture','savoir'], 'active');

-- Rituels hebdo seed (4 prochaines semaines)
INSERT INTO vida_assoc.rituals (title, description, type, intention, guided_steps, scheduled_at, duration_minutes, reward_vida_credits, status) VALUES
('Rituel Paix Mondiale', 'Méditation collective pour la paix, simultanée partout dans le monde.', 'paix', 'Que la paix s''installe là où règnent les conflits.', '[{"step":1,"title":"Centrage","duration_min":3},{"step":2,"title":"Respiration 4-7-8","duration_min":5},{"step":3,"title":"Visualisation paix","duration_min":10},{"step":4,"title":"Intention collective","duration_min":2}]'::jsonb, now() + interval '3 days', 20, 300, 'upcoming'),
('Rituel Gratitude', 'Écrire 3 gratitudes + envoi collectif d''énergie.', 'gratitude', 'Gratitude pour la vie, les proches, la planète.', '[{"step":1,"title":"3 gratitudes écrites","duration_min":5},{"step":2,"title":"Respiration","duration_min":5},{"step":3,"title":"Envoi","duration_min":5}]'::jsonb, now() + interval '10 days', 15, 200, 'upcoming'),
('Rituel Dépollution', 'Intention collective de purification des océans + mission déchets suggérée.', 'depollution', 'Purifier les océans et les sols par l''action et l''intention.', '[{"step":1,"title":"Intention","duration_min":5},{"step":2,"title":"Visualisation océans propres","duration_min":10},{"step":3,"title":"Mission déchets offline","duration_min":5}]'::jsonb, now() + interval '17 days', 20, 250, 'upcoming'),
('Rituel Amour Universel', 'Expansion du cœur, envoi d''amour à la planète.', 'amour', 'Amour inconditionnel pour tout ce qui vit.', '[{"step":1,"title":"Respiration du cœur","duration_min":5},{"step":2,"title":"Expansion d''amour","duration_min":10},{"step":3,"title":"Dédicace","duration_min":5}]'::jsonb, now() + interval '24 days', 20, 250, 'upcoming')
ON CONFLICT DO NOTHING;

-- Produits VIDA seed
INSERT INTO vida_assoc.products (slug, name, description, price_cents, category, image_url, vida_cashback_percent, featured, external_url) VALUES
('bracelet-vida-graine', 'Bracelet VIDA Graine', 'Bracelet tissé main, couleur verte. Symbole de l''engagement VIDA.', 1900, 'bracelet', 'https://image.pollinations.ai/prompt/elegant%20green%20braided%20bracelet%20nature%20spiritual%20minimalist?width=800&height=800&nologo=true', 10, true, 'https://purama.dev'),
('bracelet-vida-lumiere', 'Bracelet VIDA Lumière', 'Version dorée pour les niveaux avancés.', 3900, 'bracelet', 'https://image.pollinations.ai/prompt/golden%20sacred%20bracelet%20minimalist%20light%20reflection?width=800&height=800&nologo=true', 10, true, 'https://purama.dev'),
('purificateur-eau', 'Purificateur d''eau vivante', 'Filtration naturelle multi-étapes, sans plastique.', 12900, 'purificateur_eau', 'https://image.pollinations.ai/prompt/elegant%20water%20purifier%20natural%20ceramic%20minimal?width=800&height=800&nologo=true', 7, true, 'https://purama.dev'),
('livre-pleine-puissance', 'Livre — Retrouver ta pleine puissance', 'Guide pratique écrit par la communauté VIDA. 240 pages.', 2500, 'livre', 'https://image.pollinations.ai/prompt/inspirational%20book%20cover%20nature%20spiritual%20green%20gold?width=800&height=800&nologo=true', 5, false, 'https://purama.dev'),
('formation-vida-complet', 'Formation VIDA Complète', '12 modules vidéo : soin, alimentation, énergie, relation, mission de vie.', 9900, 'formation', 'https://image.pollinations.ai/prompt/online%20course%20nature%20wellness%20green%20elegant?width=800&height=800&nologo=true', 8, true, 'https://purama.dev'),
('kit-jardin-solidaire', 'Kit jardin solidaire', '10 graines bio, terreau, pot biodégradable. 5% des ventes reversés.', 2900, 'jardin', 'https://image.pollinations.ai/prompt/garden%20kit%20seeds%20eco%20biodegradable%20minimal?width=800&height=800&nologo=true', 5, false, 'https://purama.dev'),
('soin-energetique-session', 'Séance soin énergétique en visio', '45 min avec un praticien vérifié VIDA.', 4500, 'soin', 'https://image.pollinations.ai/prompt/energy%20healing%20session%20light%20hands%20peaceful?width=800&height=800&nologo=true', 6, false, 'https://purama.dev')
ON CONFLICT (slug) DO NOTHING;

-- Formations seed
INSERT INTO vida_assoc.formations (slug, title, description, type, target_audience, duration_minutes, is_free, price_cents, thumbnail_url) VALUES
('decouvrir-vida', 'Découvrir VIDA', 'Introduction à l''univers VIDA et au parcours de conscience.', 'video', 'tous', 20, true, 0, 'https://image.pollinations.ai/prompt/elegant%20spiritual%20intro%20nature%20morning%20light?width=800&height=450&nologo=true'),
('bracelet-energetique', 'Activer ton bracelet VIDA', 'Protocole simple pour activer ton bracelet et le porter.', 'video', 'tous', 10, true, 0, 'https://image.pollinations.ai/prompt/spiritual%20bracelet%20activation%20meditation?width=800&height=450&nologo=true'),
('soin-energetique-base', 'Bases du soin énergétique', 'Techniques simples pour prendre soin de toi et des autres.', 'video', 'adulte', 60, true, 0, 'https://image.pollinations.ai/prompt/energy%20healing%20beginner%20hands?width=800&height=450&nologo=true'),
('meditation-enfants', 'Méditation pour enfants', 'Exercices courts et ludiques.', 'audio', 'enfant', 15, true, 0, 'https://image.pollinations.ai/prompt/peaceful%20child%20meditation%20nature?width=800&height=450&nologo=true'),
('formation-audio-malvoyants', 'VIDA pour malvoyants (audio)', 'Format 100 % audio, accessible.', 'audio', 'handicap_visuel', 30, true, 0, 'https://image.pollinations.ai/prompt/accessibility%20audio%20headphones%20light?width=800&height=450&nologo=true'),
('pleine-puissance', 'Retrouver sa pleine puissance', 'Formation complète 12 modules.', 'video', 'adulte', 720, false, 9900, 'https://image.pollinations.ai/prompt/powerful%20transformation%20nature%20warrior%20peaceful?width=800&height=450&nologo=true')
ON CONFLICT (slug) DO NOTHING;

-- FAQ seed
INSERT INTO vida_assoc.faq_articles (category, question, answer, position) VALUES
('démarrage', 'Qu''est-ce que VIDA ?', 'VIDA est la plateforme mondiale où chaque don, chaque mission et chaque action positive est récompensée, tracée et multipliée. Toutes les associations du monde sont unies sous un seul cœur.', 1),
('démarrage', 'Comment commencer ?', 'Inscris-toi gratuitement. Tu reçois 100 crédits VIDA + 1 ticket concours. Depuis ton tableau de bord, tu peux voir les missions du jour et commencer immédiatement.', 2),
('missions', 'Comment sont vérifiées les missions ?', 'Photo + GPS + EXIF + IA VIDA qui analyse. Certaines missions demandent une double confirmation mutuelle ou une validation humaine en cas de litige.', 3),
('missions', 'Qui crée les missions ?', 'VIDA elle-même (missions universelles), les associations vérifiées, les entreprises sponsors, et les particuliers pour leurs besoins ponctuels (avec escrow).', 4),
('abonnement', 'Quels sont les abonnements ?', 'Découverte (gratuit, lecture + 3 missions/mois), VIDA One (3 €/mois — 100 % reversés aux associations), VIDA Premium (6,90 €/mois — missions illimitées, IA illimitée, 5x concours).', 5),
('abonnement', 'Puis-je mettre en pause ?', 'Oui : tu peux mettre ton abonnement en pause avec un tarif réduit à vie (moitié prix) plutôt que de résilier.', 6),
('dons', 'Comment sont redistribués les dons ?', '100 % des dons VIDA One vont aux associations. Sur les autres dons, VIDA prélève 5 à 10 % pour fonctionner. 50 % des revenus sont redistribués mensuellement aux associations et utilisateurs selon leur score d''impact.', 7),
('dons', 'Puis-je donner des objets ?', 'Oui, onglet "Dons matériels" : photo, description, localisation de retrait. Les associations locales récupèrent.', 8),
('rituels', 'C''est quoi les rituels ?', 'Chaque semaine, rituel collectif (méditation + intention commune). 20 min, guidé, simultané partout dans le monde. Paiement en crédits VIDA à chaque participation.', 9),
('parrainage', 'Comment fonctionne le parrainage ?', 'Ton lien personnel rapporte 50 % du premier abonnement de chaque filleul + 10 % à vie tant qu''il reste abonné. Les filleuls bénéficient de -50 % le premier mois.', 10),
('accessibilite', 'L''app est-elle accessible ?', 'Oui : modes adaptés handicap visuel, auditif, moteur, enfants, seniors. Voix, contrastes, navigation simplifiée, vibrations. Multisensoriel désactivable.', 11),
('rgpd', 'Et mes données ?', 'RGPD complet. Tu peux exporter / supprimer toutes tes données depuis Paramètres. Aucune revente. DPO : matiss.frasne@gmail.com.', 12),
('wallet', 'Comment retirer mon argent ?', 'Dès 5 €, tu peux demander un virement IBAN dans Paramètres → Wallet. Traitement sous 3 jours ouvrés.', 13),
('ia', 'Qui est VIDA l''IA ?', 'VIDA est notre assistant intelligent expert de la plateforme. Il répond à tes questions, te propose les missions parfaites selon ton profil, ton énergie et ta localisation.', 14),
('contact', 'Comment nous contacter ?', 'Chat IA (instant), formulaire /contact, ou email matiss.frasne@gmail.com pour les sujets sensibles.', 15)
ON CONFLICT DO NOTHING;

-- Concours seed
INSERT INTO vida_assoc.contests (title, description, type, prizes, total_pool_cents, start_date, end_date, entry_method, status) VALUES
('Concours Hebdo VIDA', 'Tirage chaque dimanche soir. 10 gagnants. Produits VIDA + promos.', 'weekly',
  '[{"rank":1,"description":"1 an VIDA Premium gratuit","value_cents":8280},{"rank":2,"description":"6 mois VIDA Premium","value_cents":4140},{"rank":3,"description":"Bracelet VIDA Lumière","value_cents":3900},{"rank":4,"description":"-50% marketplace 30 jours","value_cents":0},{"rank":5,"description":"500 crédits VIDA","value_cents":500},{"rank":6,"description":"300 crédits","value_cents":300},{"rank":7,"description":"200 crédits","value_cents":200},{"rank":8,"description":"150 crédits","value_cents":150},{"rank":9,"description":"100 crédits","value_cents":100},{"rank":10,"description":"Bracelet VIDA Graine","value_cents":1900}]'::jsonb,
  19470,
  now(), now() + interval '7 days', 'automatic', 'live'),
('Concours Mensuel VIDA', 'Tirage mensuel. 10 gagnants. Cagnotte réelle + produits premium.', 'monthly',
  '[{"rank":1,"description":"500 €","value_cents":50000},{"rank":2,"description":"250 €","value_cents":25000},{"rank":3,"description":"Kit VIDA Lumière complet","value_cents":19900},{"rank":4,"description":"100 €","value_cents":10000},{"rank":5,"description":"75 €","value_cents":7500},{"rank":6,"description":"50 €","value_cents":5000},{"rank":7,"description":"30 €","value_cents":3000},{"rank":8,"description":"20 €","value_cents":2000},{"rank":9,"description":"20 €","value_cents":2000},{"rank":10,"description":"15 €","value_cents":1500}]'::jsonb,
  125900,
  now(), now() + interval '30 days', 'automatic', 'live')
ON CONFLICT DO NOTHING;

SELECT 'VIDA_ASSOC schema deployed OK' AS result;
