import { Nav, Hero, Stats, Features, HowItWorks, Pricing, AssociationsList, Promise, FAQ, FinalCTA, Footer } from './components-landing'

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing />
// Extracted from page.tsx for max-lines compliance
// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl bg-[rgba(4,18,12,0.85)] border-b border-white/[0.06]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden>🌱</span>
            <span className="gradient-text font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold tracking-tight truncate">
              Sangha
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#missions" className="hover:text-[var(--text-primary)] transition-colors">Missions</a>
            <a href="#impact" className="hover:text-[var(--text-primary)] transition-colors">Impact</a>
            <a href="#associations" className="hover:text-[var(--text-primary)] transition-colors">Associations</a>
            <Link href="/pricing" className="hover:text-[var(--text-primary)] transition-colors">Tarifs</Link>
            <Link href="/aide" className="hover:text-[var(--text-primary)] transition-colors">Aide</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
              data-testid="nav-login"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-4 py-2 text-sm font-medium text-[#04120c] glow-pulse hover:opacity-90 transition-opacity"
              data-testid="nav-cta-signup"
            >
              Rejoindre →
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden text-[var(--text-primary)] -mr-2 p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[rgba(4,18,12,0.95)] backdrop-blur-xl py-4 space-y-3">
            <a href="#missions" onClick={() => setMenuOpen(false)} className="block text-[var(--text-secondary)] py-1">Missions</a>
            <a href="#impact" onClick={() => setMenuOpen(false)} className="block text-[var(--text-secondary)] py-1">Impact</a>
            <a href="#associations" onClick={() => setMenuOpen(false)} className="block text-[var(--text-secondary)] py-1">Associations</a>
            <Link href="/pricing" onClick={() => setMenuOpen(false)} className="block text-[var(--text-secondary)] py-1">Tarifs</Link>
            <Link href="/aide" onClick={() => setMenuOpen(false)} className="block text-[var(--text-secondary)] py-1">Aide</Link>
            <div className="flex gap-3 pt-3 border-t border-white/10">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-center">Connexion</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-4 py-2 text-sm text-center text-[#04120c] font-medium">Rejoindre</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// ─── Hero (iOS-style: clean, gradient dark, glass) ──────────────────────────
function Hero() {
  return (
    <section
      className="relative overflow-x-clip overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32"
      data-testid="hero"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute top-1/3 right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(212,175,55,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(4,18,12,0.4)_60%,var(--bg-void)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text-secondary)]"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]" />
          </span>
          <span className="tracking-wide uppercase">Sangha · Nouveau</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-8 font-[family-name:var(--font-display)] text-[44px] leading-[1.02] sm:text-6xl md:text-7xl font-semibold tracking-[-0.03em] max-w-3xl mx-auto"
        >
          Agir ensemble.{' '}
          <span className="gradient-text">Changer le monde.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.16 }}
          className="mt-6 text-[17px] sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-[1.5]"
        >
          Missions, dons et rituels collectifs — au service de toutes les associations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/signup"
            data-testid="hero-cta-signup"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-[#04120c] px-7 py-3.5 text-[15px] font-semibold shadow-[0_10px_40px_-12px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_60px_-12px_rgba(255,255,255,0.4)] transition-all"
          >
            Commencer
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#missions"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-7 py-3.5 text-[15px] text-[var(--text-primary)] hover:bg-white/10 transition-all"
          >
            <PlayCircle className="h-4 w-4" />
            Voir une mission
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] sm:text-[13px] text-[var(--text-muted)]"
        >
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> Gratuit</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> Sans carte</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> 50 % reversés</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#10B981]" /> RGPD</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 mx-auto max-w-xl"
        >
          <div className="relative rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-8 shadow-[0_40px_120px_-20px_rgba(16,185,129,0.25)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#0ea371] flex items-center justify-center text-xl">🌱</div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Mission du jour</div>
                  <div className="text-xs text-[var(--text-muted)]">À 2 min · Frasne</div>
                </div>
              </div>
              <div className="rounded-full bg-[#10B981]/15 text-[#10B981] text-[11px] font-semibold px-3 py-1">+25 pts</div>
            </div>
            <div className="text-left">
              <div className="text-[15px] text-[var(--text-primary)] leading-snug">Ramasser 10 déchets près du lac et photographier le sac.</div>
              <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-[#10B981] to-[#D4AF37]" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[var(--text-muted)]">
                <span>6 / 10 déchets</span>
                <span>64 %</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Stats ───────────────────────────────────────────────────────────────────
// Truth-only: pas de chiffres inventés. On montre la promesse, pas des stats fake.
function Stats() {
  const pillars = [
    { value: '100 %', label: 'Don Sangha One', desc: 'Reversé intégralement aux associations' },
    { value: '50 %', label: 'Redistribué', desc: 'Des revenus aux associations + utilisateurs' },
    { value: '0 €', label: 'Pour démarrer', desc: 'Inscription gratuite, sans carte' },
    { value: '5 €', label: 'Retrait IBAN', desc: 'Seuil minimum, virement sous 3 jours' },
  ]
  return (
    <section className="py-16 border-y border-white/[0.06] bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8" staggerDelay={0.08}>
          {pillars.map((s) => (
            <StaggerItem key={s.label} className="text-center">
              <div className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">{s.value}</div>
              <div className="mt-2 text-xs sm:text-sm text-[var(--text-primary)] font-medium">{s.label}</div>
              <div className="mt-1 text-[11px] sm:text-xs text-[var(--text-muted)] leading-snug">{s.desc}</div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: Globe, title: 'Missions partout', desc: 'Ramasser des déchets, aider une personne âgée, partager une méditation. Preuve photo, GPS ou validée par Sangha.' },
    { icon: HandHeart, title: 'Dons tracés', desc: 'Chaque euro suivi jusqu\'à son usage final. Arrondissement, dons récurrents, dons matériels.' },
    { icon: Sparkles, title: 'Rituels collectifs', desc: 'Méditations simultanées chaque semaine. Paix, gratitude, dépollution, soin collectif.' },
    { icon: Heart, title: 'Impact réel', desc: 'Compteur kg CO₂, arbres plantés, repas distribués, heures bénévoles. Affichage personnel et global.' },
    { icon: Users, title: 'Associations vérifiées', desc: 'Chaque association rejoint Sangha après vérification. Transparence sur leurs missions et leurs dons reçus.' },
    { icon: Trophy, title: 'Concours hebdo', desc: '10 gagnants chaque semaine. Abonnés Premium : 5x plus de places.' },
    { icon: BookOpen, title: 'Formations Sangha', desc: 'Gratuites pour les personnes dans le besoin. Adaptées aux handicaps visuels, auditifs, moteurs.' },
    { icon: ShoppingBag, title: 'Marketplace solidaire', desc: 'Bracelets, purificateurs d\'eau, formations, livres inspirants. Cashback Sangha pour les abonnés.' },
    { icon: Shield, title: '100 % conforme', desc: 'RGPD, App Store, Play Store. Anti-fraude IA. Chiffrement, export, suppression à tout moment.' },
  ] as const
  return (
    <section id="missions" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Une plateforme, <span className="gradient-text">infinies actions</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Tout ce qu&apos;il faut pour rejoindre un mouvement positif, agir concrètement, être récompensé.
          </p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" staggerDelay={0.06}>
          {features.map(({ icon: Icon, title, desc }) => (
            <StaggerItem key={title} className="glass rounded-2xl p-6 hover:border-[#10B981]/30 transition-colors">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── How It Works ────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '1', title: 'Tu t\'inscris', desc: '100 crédits Sangha offerts + 1 ticket concours. En 30 secondes.', icon: Leaf },
    { num: '2', title: 'Tu choisis une mission', desc: 'Près de chez toi, qui te correspond. Sangha te propose les meilleures selon ton profil.', icon: Globe },
    { num: '3', title: 'Tu agis et prouves', desc: 'Photo, GPS, validation Sangha. 10 secondes suffisent pour prouver ton action.', icon: Heart },
    { num: '4', title: 'Tu es récompensé', desc: 'Crédits Sangha, places concours, argent réel. Dès 5 €, retrait IBAN.', icon: Trophy },
  ]
  return (
    <section id="impact" className="py-20 md:py-32 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Comment ça <span className="gradient-text">marche</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)]">4 étapes. Zéro friction.</p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6" staggerDelay={0.08}>
          {steps.map(({ num, title, desc, icon: Icon }) => (
            <StaggerItem key={num} className="relative">
              <div className="glass rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-[family-name:var(--font-display)] font-bold text-[#10B981]">{num}</span>
                  <Icon className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      id: 'free',
      name: 'Découverte',
      price: '0 €',
      period: 'pour toujours',
      desc: 'Pour découvrir Sangha sans engagement',
      features: [
        'Accès lecture complet',
        '3 missions gratuites / mois',
        '1 don ponctuel / mois',
        'Compteur impact personnel',
        'Feed quotidien',
      ],
      cta: 'Commencer gratuitement',
      href: '/signup',
    },
    {
      id: 'one',
      name: 'Sangha One',
      price: '3 €',
      period: '/ mois',
      desc: 'L\'abonnement solidaire — 100 % reversés',
      features: [
        '100 % destiné aux associations',
        'Missions illimitées',
        'Don automatique chaque mois',
        'Concours hebdo inclus',
        'Badge cœur lumineux',
      ],
      cta: 'Rejoindre Sangha One',
      href: '/signup?plan=one',
    },
    {
      id: 'premium',
      name: 'Sangha Premium',
      price: '6,90 €',
      period: '/ mois',
      desc: 'Tout Sangha. Récompenses x5.',
      features: [
        'Tout Sangha One inclus',
        'Missions rémunérées illimitées',
        'Rituels collectifs inclus',
        'x5 places concours',
        'Assistant Sangha illimité',
        'Formations premium',
        'Cashback 5 % marketplace',
        'Retrait IBAN dès 5 €',
      ],
      cta: 'Essayer 14j gratuit',
      href: '/signup?plan=premium',
      popular: true,
    },
  ]
  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Des <span className="gradient-text">prix honnêtes</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)]">
            -30 % en annuel • 14 jours d&apos;essai gratuit • Pause à vie possible
          </p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {plans.map((plan) => (
            <StaggerItem
              key={plan.id}
              className={`glass rounded-3xl p-6 sm:p-8 relative ${plan.popular ? 'border-[#10B981]/50 shadow-[0_20px_80px_-20px_rgba(16,185,129,0.4)]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-4 py-1 text-xs font-semibold text-[#04120c] whitespace-nowrap">
                  ⭐ POPULAIRE
                </div>
              )}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-display)]">{plan.price}</span>
                <span className="text-[var(--text-muted)]">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{plan.desc}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="text-[var(--text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                data-testid={`pricing-cta-${plan.id}`}
                className={`mt-8 block w-full rounded-xl text-center px-4 py-3 font-medium transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#10B981] to-[#D4AF37] text-[#04120c] hover:opacity-90'
                    : 'border border-white/10 bg-white/5 text-[var(--text-primary)] hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── Associations (truth-only: pas de noms inventés) ─────────────────────────
function AssociationsList() {
  const themes = [
    { emoji: '🌍', label: 'Environnement', desc: 'Dépollution, reforestation, protection animale' },
    { emoji: '🤝', label: 'Humanitaire', desc: 'Aide alimentaire, sans-abri, urgence' },
    { emoji: '🩺', label: 'Santé', desc: 'Soin, prévention, accompagnement' },
    { emoji: '🧒', label: 'Enfance', desc: 'Éducation, protection, jeux' },
    { emoji: '👵', label: 'Seniors', desc: 'Compagnie, courses, lien social' },
    { emoji: '♿', label: 'Handicap', desc: 'Accessibilité, accompagnement, transport' },
    { emoji: '⚖️', label: 'Droits', desc: 'Justice, plaidoyer, défense' },
    { emoji: '🐾', label: 'Animaux', desc: 'Refuge, protection, adoption' },
  ]
  return (
    <section id="associations" className="py-20 md:py-32 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Toutes les causes, <span className="gradient-text">un seul cœur</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Chaque association vérifiée rejoint Sangha gratuitement. Inscris la tienne ou
            soutiens celles qui agissent déjà — par thème, par pays, près de chez toi.
          </p>
        </ScrollReveal>
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" staggerDelay={0.04}>
          {themes.map((t) => (
            <StaggerItem key={t.label} className="glass rounded-2xl p-4 sm:p-5 flex items-start gap-3 hover:border-[#10B981]/30 transition-colors">
              <span className="text-2xl sm:text-3xl shrink-0" aria-hidden>{t.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{t.label}</div>
                <div className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-snug">{t.desc}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/associations"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-all"
          >
            Découvrir les associations <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm text-[#10B981] hover:text-[#D4AF37] transition-colors"
          >
            Inscrire mon association
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Promise ─────────────────────────────────────────────────────────────────
function Promise() {
  return (
    <section className="py-20 md:py-32">
      <ScrollReveal className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <Quote className="mx-auto h-10 w-10 text-[#D4AF37] mb-6" />
        <p className="font-[family-name:var(--font-display)] text-xl sm:text-2xl md:text-3xl font-semibold leading-relaxed text-[var(--text-primary)]">
          « La plateforme où chaque don, chaque mission, chaque action positive est
          récompensée, tracée et multipliée. Toutes les associations qui nous rejoignent,
          unies sous un seul cœur. »
        </p>
        <div className="mt-6 text-sm text-[var(--text-muted)]">Tissma, fondateur PURAMA — Frasne, 25560</div>
      </ScrollReveal>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const items = [
    { q: 'Dois-je payer pour utiliser Sangha ?', a: 'Non. Tu peux rejoindre Sangha gratuitement et faire jusqu\'à 3 missions par mois, donner, consulter toutes les associations. Sangha One (3 €/mois) et Sangha Premium (6,90 €/mois) débloquent l\'accès illimité et des récompenses.' },
    { q: 'Comment les missions sont-elles vérifiées ?', a: 'Chaque mission demande une preuve : photo horodatée, métadonnées EXIF, GPS, parfois vidéo. Sangha analyse la preuve et valide. En cas de doute : double confirmation mutuelle ou audit humain.' },
    { q: 'Où va l\'argent de mes dons ?', a: 'Chaque euro est tracé de bout en bout. Les dons aux associations leur sont reversés. Sur Sangha One, 100 % sont redistribués. 50 % des revenus de Sangha sont redistribués mensuellement aux associations et utilisateurs selon leur impact.' },
    { q: 'Puis-je retirer mon argent gagné ?', a: 'Oui. Dès 5 € de solde wallet, tu peux demander un virement IBAN dans Paramètres → Wallet. Traitement sous 3 jours ouvrés.' },
    { q: 'Sangha est-elle accessible aux handicapés ?', a: 'Totalement : modes adaptés handicap visuel, auditif, moteur, enfants, seniors. Voix, contrastes, navigation simplifiée, vibrations, mode multisensoriel désactivable.' },
    { q: 'Que deviennent mes données ?', a: 'RGPD intégral. Tu peux exporter ou supprimer toutes tes données en un clic. Aucune revente. DPO : matiss.frasne@gmail.com.' },
  ]
  return (
    <section id="faq" className="py-20 md:py-32 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-10 md:mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
        </ScrollReveal>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <button
              type="button"
              key={it.q}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full text-left glass rounded-2xl p-5 sm:p-6 hover:border-[#10B981]/30 transition-colors"
              aria-expanded={openIdx === idx}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">{it.q}</span>
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#10B981] text-xl leading-none">
                  <span className={`inline-block transition-transform ${openIdx === idx ? 'rotate-45' : ''}`}>+</span>
                </span>
              </div>
              {openIdx === idx && (
                <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">{it.a}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 md:py-32">
      <ScrollReveal className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#10B981]/30 bg-gradient-to-br from-[#10B981]/10 via-transparent to-[#D4AF37]/10 p-8 sm:p-12 md:p-16 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-[#10B981]/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />
          </div>
          <div className="relative">
            <Zap className="mx-auto h-10 w-10 text-[#D4AF37] mb-4" />
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold">
              Prêt à <span className="gradient-text">agir</span> ?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
              Rejoins Sangha gratuitement. Ta première mission t&apos;attend déjà.
              100 crédits et un ticket concours offerts.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                data-testid="final-cta-signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D4AF37] px-8 py-4 text-base font-semibold text-[#04120c] shadow-lg hover:shadow-xl transition-all"
              >
                Rejoindre Sangha <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/aide"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base text-[var(--text-primary)] hover:bg-white/10 transition-all"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="text-2xl" aria-hidden>🌱</span>
              <span className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold">Sangha</span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] max-w-xs">
              Une SASU PURAMA et une Association PURAMA (loi 1901) — 8 Rue de la Chapelle, 25560 Frasne.
            </p>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              TVA non applicable, art. 293 B du CGI. 10 % du CA reversés à l&apos;association.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Produit</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/pricing" className="hover:text-[var(--text-primary)]">Tarifs</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[var(--text-primary)]">Comment ça marche</Link></li>
              <li><Link href="/associations" className="hover:text-[var(--text-primary)]">Associations</Link></li>
              <li><Link href="/ecosystem" className="hover:text-[var(--text-primary)]">Écosystème</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Ressources</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/aide" className="hover:text-[var(--text-primary)]">Centre d&apos;aide</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--text-primary)]">Contact</Link></li>
              <li><Link href="/status" className="hover:text-[var(--text-primary)]">Status</Link></li>
              <li><Link href="/changelog" className="hover:text-[var(--text-primary)]">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Légal</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/mentions-legales" className="hover:text-[var(--text-primary)]">Mentions légales</Link></li>
              <li><Link href="/politique-confidentialite" className="hover:text-[var(--text-primary)]">Confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-[var(--text-primary)]">CGU</Link></li>
              <li><Link href="/cgv" className="hover:text-[var(--text-primary)]">CGV</Link></li>
              <li><Link href="/cookies" className="hover:text-[var(--text-primary)]">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
            © 2026 Sangha — Tous droits réservés. Fait avec 💚 en France.
          </p>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <main id="main-content">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <AssociationsList />
      <Promise />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
