'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  Home, Globe, Heart, User, LogOut, ChevronLeft, ChevronRight,
  Sparkles, HandHeart, Users, Wallet, Bell, Trophy, Gift,
  Megaphone, Shield, BookOpen, ShoppingBag, Settings, MessageCircle,
  HelpCircle, Share2, Wind, Flower2, Coins, Star,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { SUPER_ADMIN_EMAIL, APP_SHORT_NAME } from '@/lib/constants'
import LocaleSwitcher from '@/components/shared/LocaleSwitcher'

type NavItem = { href: string; icon: typeof Home; label: string; testId: string }

const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Accueil', testId: 'nav-accueil' },
  { href: '/dashboard/missions', icon: Globe, label: 'Missions', testId: 'nav-missions' },
  { href: '/dashboard/impact', icon: Heart, label: 'Impact', testId: 'nav-impact' },
  { href: '/dashboard/profile', icon: User, label: 'Profil', testId: 'nav-profile' },
]

const SECONDARY_NAV: NavItem[] = [
  { href: '/dashboard/associations', icon: HandHeart, label: 'Associations', testId: 'nav-associations' },
  { href: '/dashboard/dons', icon: Gift, label: 'Dons', testId: 'nav-dons' },
  { href: '/dashboard/breathe', icon: Wind, label: 'Respiration', testId: 'nav-breathe' },
  { href: '/dashboard/gratitude', icon: Flower2, label: 'Gratitude', testId: 'nav-gratitude' },
  { href: '/dashboard/rituels', icon: Sparkles, label: 'Rituels', testId: 'nav-rituels' },
  { href: '/dashboard/concours', icon: Trophy, label: 'Concours', testId: 'nav-concours' },
  { href: '/dashboard/boutique', icon: ShoppingBag, label: 'Boutique', testId: 'nav-boutique' },
  { href: '/dashboard/formations', icon: BookOpen, label: 'Formations', testId: 'nav-formations' },
  { href: '/dashboard/communaute', icon: Users, label: 'Communauté', testId: 'nav-communaute' },
  { href: '/dashboard/chat-vida', icon: MessageCircle, label: 'Assistant Sangha', testId: 'nav-chat-vida' },
  { href: '/dashboard/referral', icon: Share2, label: 'Parrainage', testId: 'nav-referral' },
  { href: '/dashboard/influenceur', icon: Megaphone, label: 'Influenceur', testId: 'nav-influenceur' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet', testId: 'nav-wallet' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications', testId: 'nav-notifications' },
  { href: '/dashboard/daily-gift', icon: Gift, label: 'Coffre du jour', testId: 'nav-daily-gift' },
  { href: '/dashboard/boutique-points', icon: Coins, label: 'Boutique points', testId: 'nav-boutique-points' },
  { href: '/dashboard/classement-points', icon: Star, label: 'Classement', testId: 'nav-classement' },
  { href: '/dashboard/guide', icon: HelpCircle, label: 'Guide', testId: 'nav-guide' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres', testId: 'nav-settings' },
]

const ADMIN_ITEM: NavItem = { href: '/dashboard/admin', icon: Shield, label: 'Admin', testId: 'nav-admin' }

const WISDOM_QUOTES = [
  'Chaque petit geste est une graine de changement.',
  'L\u2019amour que tu donnes te revient multiplie.',
  'Agir, c\u2019est deja guerir le monde.',
  'La gratitude transforme l\u2019ordinaire en extraordinaire.',
  'Ton impact est plus grand que tu ne le crois.',
  'Ensemble, nous sommes la vague qui change tout.',
  'La bienveillance est ta plus grande force.',
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  useEffect(() => { setQuoteIdx(Math.floor(Math.random() * WISDOM_QUOTES.length)) }, [])
  const isSuperAdmin = profile?.email === SUPER_ADMIN_EMAIL || profile?.role === 'super_admin'
  const navItems = isSuperAdmin ? [...PRIMARY_NAV, ...SECONDARY_NAV, ADMIN_ITEM] : [...PRIMARY_NAV, ...SECONDARY_NAV]

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--bg-nebula)]/80 backdrop-blur-xl transition-all duration-300 lg:flex',
        collapsed ? 'w-16' : 'w-60'
      )}
      aria-label="Navigation principale"
    >
      <div className={cn('flex h-16 items-center border-b border-[var(--border)] px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🌱</span>
            <span className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold">
              {APP_SHORT_NAME}
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors"
          aria-label={collapsed ? 'Déployer la navigation' : 'Réduire la navigation'}
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 scrollbar-thin">
        {navItems.map(({ href, icon: Icon, label, testId }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/')) || (href === '/dashboard' && pathname === '/dashboard')
          return (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center' : '',
                active
                  ? 'bg-[var(--cyan)]/10 text-[var(--cyan)] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110', active && 'drop-shadow-[0_0_6px_var(--cyan)]')} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-2 rounded-xl bg-[#10B981]/5 border border-[#10B981]/10 p-3">
          <p className="text-[11px] leading-relaxed text-[var(--text-muted)] italic">
            &quot;{WISDOM_QUOTES[quoteIdx]}&quot;
          </p>
        </div>
      )}

      <div className="border-t border-[var(--border)] p-3 space-y-2">
        {!collapsed && <LocaleSwitcher />}
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)] text-sm font-semibold text-white">
              {getInitials(profile?.display_name ?? profile?.email ?? null)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {profile?.display_name ?? profile?.email ?? 'Voyageur'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Niveau {profile?.level ?? 1}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label="Déconnexion"
              data-testid="logout-sidebar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)] text-sm font-semibold text-white">
              {getInitials(profile?.display_name ?? profile?.email ?? null)}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label="Déconnexion"
              data-testid="logout-sidebar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
