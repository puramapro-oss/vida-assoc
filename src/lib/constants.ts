export const SUPER_ADMIN_EMAIL = 'matiss.frasne@gmail.com'

export const APP_NAME = 'Sangha'
export const APP_SHORT_NAME = 'Sangha'
export const APP_SLUG = 'vida-assoc'
export const APP_DOMAIN = 'vida-assoc.purama.dev'
export const APP_URL = 'https://vida-assoc.purama.dev'
export const APP_COLOR = '#10B981'
export const APP_COLOR_SECONDARY = '#D4AF37'
export const APP_SCHEMA = 'vida_assoc'
export const AI_NAME = 'Sangha'

export const COMPANY_INFO = {
  name: 'SASU PURAMA',
  address: '8 Rue de la Chapelle, 25560 Frasne',
  country: 'France',
  taxNote: 'TVA non applicable, art. 293 B du CGI',
  dpo: 'matiss.frasne@gmail.com',
  association: 'Association PURAMA (loi 1901)',
  founder: 'Matiss Dornier',
}

// Abonnements Sangha (SASU Sangha Stripe)
// Prix concurrents analysés : GoFundMe/HelloAsso/Lilo (0-3€/mois), apps bien-être 5-15€/mois
// Sangha One = 3€/mois destiné intégralement aux associations
// Sangha Premium = 6.90€/mois (accès total, dashboards, IA illimitée, 5x concours)
// Annuel -30%, premier mois -10%, essai 14 jours
export const PLANS = {
  free: {
    id: 'free',
    label: 'Découverte',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      'Accès lecture : toutes les missions et associations',
      'Feed quotidien',
      'Jusqu\'à 3 missions gratuites par mois',
      '1 don ponctuel par mois',
      'Compteur impact personnel',
    ],
  },
  one: {
    id: 'one',
    label: 'Sangha One',
    price_monthly: 300, // 3€
    price_yearly: 2520, // 25.20€ (-30%)
    first_month_discount: 0, // déjà prix mini — 100% reversé
    redistributed_to_assos: 100,
    features: [
      '3€/mois — 100 % reversés aux associations',
      'Missions illimitées',
      'Don automatique chaque mois',
      'Accès concours hebdomadaires',
      'Badge cœur lumineux sur le profil',
    ],
  },
  premium: {
    id: 'premium',
    label: 'Sangha Premium',
    price_monthly: 690, // 6.90€
    price_yearly: 5798, // 57.98€ (-30%)
    first_month_discount: 10, // -10% premier mois
    features: [
      'Tout Sangha One inclus',
      'Missions rémunérées illimitées',
      'Rituels collectifs inclus',
      'x5 places aux concours (hebdo / mensuels / annuels)',
      'Assistant Sangha illimité (chat expert)',
      'Accès aux formations Sangha',
      'Dashboard impact avancé',
      'Cashback 5 % sur le marketplace Sangha',
      'Retrait IBAN dès 5 €',
    ],
    popular: true,
  },
} as const

export type PlanId = keyof typeof PLANS

// Sangha Credits : monnaie interne non convertible en euros pour les gratuits
// 100 crédits = 1€ d'équivalent pour les promos / marketplace
export const VIDA_CREDIT_TO_EUR = 0.01
export const WALLET_MIN_WITHDRAWAL = 5 // euros
export const ASSO_PERCENTAGE = 10
export const REDISTRIBUTION_PERCENTAGE = 50

// Niveaux de conscience — affichés sur profil et Fil de Vie
export const LEVELS = [
  { id: 1, name: 'Graine', min: 0, max: 99, emoji: '🌱', color: '#86efac' },
  { id: 2, name: 'Bâtisseur', min: 100, max: 499, emoji: '🪴', color: '#4ade80' },
  { id: 3, name: 'Gardien', min: 500, max: 1999, emoji: '🌳', color: '#22c55e' },
  { id: 4, name: 'Source', min: 2000, max: 9999, emoji: '💧', color: '#10b981' },
  { id: 5, name: 'Lumière', min: 10000, max: Number.MAX_SAFE_INTEGER, emoji: '✨', color: '#D4AF37' },
] as const

// Récompenses mission (Sangha crédits) — fallback quand pas de paiement cash
export const MISSION_REWARDS = {
  min_credits: 20,
  max_credits: 2000,
  pub_vida: 300,
  note_app: 500,
  story_share: 200,
  download_app: 150,
  read_book: 400,
  walk_1h: 80,
  meditation_20min: 60,
  clean_spot: 150,
  help_person: 250,
} as const

// Pourcentage commission Sangha sur chaque type de source
export const COMMISSIONS = {
  donation_to_other_asso: 5, // 5% sur dons vers autre asso
  user_mission: 20, // 20% sur missions entre particuliers (escrow)
  enterprise_mission: 10, // 10% sur missions sponsorisées
  marketplace: 15,
} as const

// Referrals
export const REFERRAL = {
  referrer_first_percent: 50, // 50% du premier abo
  referrer_lifetime_percent: 10, // 10% à vie tant que filleul abonné
  referred_first_month_discount: 50, // -50% premier mois
  cross_app_percent: 5, // 5% revenus filleul cross-app
  level_bonus_x2: true, // bonus x2 si filleul prend abonnement
} as const

// Influencer
export const INFLUENCER = {
  promo_validity_days: 7,
  promo_discount: 50, // -50% abo via lien influenceur
  commission_first: 50, // 50% premier abo
  commission_recurring: 10, // 10% récurrent à vie
} as const

// Rituels collectifs
export const RITUAL_TYPES = [
  { id: 'pleine_lune', name: 'Pleine Lune', emoji: '🌕' },
  { id: 'portail_energetique', name: 'Portail énergétique', emoji: '🌀' },
  { id: 'depollution', name: 'Dépollution mondiale', emoji: '🌍' },
  { id: 'paix', name: 'Paix mondiale', emoji: '🕊️' },
  { id: 'amour', name: 'Amour universel', emoji: '💚' },
  { id: 'pardon', name: 'Pardon', emoji: '🤲' },
  { id: 'gratitude', name: 'Gratitude', emoji: '🙏' },
  { id: 'abondance', name: 'Abondance', emoji: '🌾' },
  { id: 'soin_collectif', name: 'Soin collectif', emoji: '✨' },
] as const

// Catégories de missions (issues du BRIEF)
export const MISSION_CATEGORIES = [
  { id: 'depollution', name: 'Dépollution', icon: '♻️', color: '#10b981', description: 'Ramasser déchets, nettoyer la nature' },
  { id: 'reforestation', name: 'Reforestation', icon: '🌳', color: '#16a34a', description: 'Planter des arbres, entretenir forêts' },
  { id: 'aide_personnes_agees', name: 'Aide personnes âgées', icon: '🤝', color: '#a78bfa', description: 'Compagnie, courses, soutien' },
  { id: 'aide_handicapes', name: 'Aide handicapés', icon: '♿', color: '#60a5fa', description: 'Accompagnement, transport' },
  { id: 'aide_sans_abri', name: 'Aide sans-abri', icon: '🫂', color: '#f472b6', description: 'Distribution repas, vêtements' },
  { id: 'anti_gaspillage', name: 'Anti-gaspillage', icon: '🥖', color: '#fbbf24', description: 'Récupération invendus, distribution' },
  { id: 'jardinage', name: 'Jardinage', icon: '🌱', color: '#22c55e', description: 'Potager solidaire, espaces verts' },
  { id: 'plantation', name: 'Plantation', icon: '🌿', color: '#4ade80', description: 'Graines, semis, pousses' },
  { id: 'nettoyage', name: 'Nettoyage', icon: '🧹', color: '#38bdf8', description: 'Nettoyer espaces publics' },
  { id: 'courses_solidaires', name: 'Courses solidaires', icon: '🛒', color: '#f59e0b', description: 'Faire les courses pour quelqu\'un' },
  { id: 'compagnie_seniors', name: 'Compagnie seniors', icon: '👵', color: '#c084fc', description: 'Lecture, jeux, promenade' },
  { id: 'livraison_repas', name: 'Livraison repas', icon: '🍱', color: '#fb923c', description: 'Distribution repas chauds' },
  { id: 'soutien_scolaire', name: 'Soutien scolaire', icon: '📚', color: '#818cf8', description: 'Aide aux devoirs, tutorat' },
  { id: 'traduction', name: 'Traduction', icon: '🌐', color: '#06b6d4', description: 'Traduire pour personnes en difficulté' },
  { id: 'moderation', name: 'Modération', icon: '🛡️', color: '#64748b', description: 'Modérer communautés saines' },
  { id: 'signalement_pollution', name: 'Signalement pollution', icon: '📸', color: '#ef4444', description: 'Photographier et signaler' },
  { id: 'collecte_dechets', name: 'Collecte déchets', icon: '🗑️', color: '#84cc16', description: 'Collectes organisées' },
  { id: 'tri_recyclage', name: 'Tri / recyclage', icon: '♻️', color: '#10b981', description: 'Tri déchetterie, point apport' },
  { id: 'reparation', name: 'Réparation', icon: '🔧', color: '#78716c', description: 'Repair café, vêtements, objets' },
  { id: 'bricolage', name: 'Bricolage', icon: '🛠️', color: '#ca8a04', description: 'Petits travaux solidaires' },
  { id: 'garde_enfants', name: 'Garde enfants', icon: '👶', color: '#f472b6', description: 'Garder enfants ponctuellement' },
  { id: 'garde_animaux', name: 'Garde animaux', icon: '🐾', color: '#f97316', description: 'Garder, promener animaux' },
  { id: 'massage_bien_etre', name: 'Massage / bien-être', icon: '💆', color: '#a855f7', description: 'Soins, détente' },
  { id: 'magnetiseur', name: 'Magnétiseur', icon: '🌀', color: '#8b5cf6', description: 'Soins énergétiques' },
  { id: 'coaching', name: 'Coaching', icon: '🎯', color: '#0ea5e9', description: 'Accompagnement personnel' },
  { id: 'sport', name: 'Sport', icon: '🏃', color: '#14b8a6', description: 'Marche, course, fitness' },
  { id: 'meditation', name: 'Méditation', icon: '🧘', color: '#d946ef', description: 'Méditation guidée, pleine conscience' },
  { id: 'rituel_collectif', name: 'Rituel collectif', icon: '🕯️', color: '#eab308', description: 'Participer aux rituels hebdo' },
  { id: 'pub_vida', name: 'Pub Sangha', icon: '📣', color: '#10B981', description: 'Parler de Sangha, partager, noter' },
  { id: 'notation_app', name: 'Notation app', icon: '⭐', color: '#fbbf24', description: 'Noter les apps Sangha' },
  { id: 'parrainage_story', name: 'Story parrainage', icon: '📱', color: '#ec4899', description: 'Story avec lien' },
  { id: 'video_promo', name: 'Vidéo promo', icon: '🎬', color: '#f43f5e', description: 'Créer vidéo courte' },
  { id: 'dons_personnes', name: 'Dons aux personnes', icon: '💝', color: '#e11d48', description: 'Donner matériel à ceux dans le besoin' },
  { id: 'jeune', name: 'Jeûne', icon: '🌾', color: '#a3a3a3', description: 'Jeûner avec accompagnement' },
  { id: 'marche_nature', name: 'Marche nature', icon: '🥾', color: '#65a30d', description: 'Marcher dans la nature' },
  { id: 'cuisine_solidaire', name: 'Cuisine solidaire', icon: '🍲', color: '#f59e0b', description: 'Cuisiner pour les autres' },
  { id: 'demenagement', name: 'Déménagement', icon: '📦', color: '#737373', description: 'Aider à déménager' },
  { id: 'aide_administrative', name: 'Aide administrative', icon: '📋', color: '#475569', description: 'Démarches, formulaires' },
  { id: 'soin_energetique', name: 'Soin énergétique', icon: '✨', color: '#c026d3', description: 'Reiki, magnétisme' },
  { id: 'lecture_malvoyants', name: 'Lecture malvoyants', icon: '📖', color: '#7c3aed', description: 'Lire pour personnes malvoyantes' },
  { id: 'formation', name: 'Formation', icon: '🎓', color: '#6366f1', description: 'Apprendre, transmettre' },
  { id: 'rangement_maison', name: 'Rangement maison', icon: '🧺', color: '#0891b2', description: 'Photo avant/après' },
] as const

export type MissionCategoryId = typeof MISSION_CATEGORIES[number]['id']

// Rôles
export const ROLES = {
  user: 'user',
  association: 'association',
  enterprise: 'enterprise',
  ong: 'ong',
  super_admin: 'super_admin',
} as const

// Routes publiques (middleware)
export const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/how-it-works',
  '/ecosystem',
  '/associations',
  '/impact-global',
  '/rituels-publics',
  '/status',
  '/changelog',
  '/privacy',
  '/terms',
  '/legal',
  '/offline',
  '/login',
  '/signup',
  '/register',
  '/onboarding',
  '/mentions-legales',
  '/politique-confidentialite',
  '/cgv',
  '/cgu',
  '/cookies',
  '/aide',
  '/contact',
  '/accessibilite',
]
