'use client'

import Link from 'next/link'

// ─── Footer ──────────────────────────────────────────────────────────────────
export function Footer() {
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
          {/* <LocaleSwitcher /> */}
        </div>
      </div>
    </footer>
