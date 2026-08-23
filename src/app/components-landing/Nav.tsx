'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function Nav() {
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
