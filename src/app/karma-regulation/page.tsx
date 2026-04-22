import { createServiceClient } from '@/lib/supabase'
import { Shield, ExternalLink, Hash } from 'lucide-react'
import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Règlement KARMA — Horodaté blockchain | ${APP_NAME}`,
  description: `Règlement officiel des jeux KARMA de ${APP_NAME}. Horodatage OpenTimestamps (blockchain Bitcoin) — vérifiable gratuitement.`,
}

export const revalidate = 60

interface Regulation {
  id: string
  kind: string
  game_slug: string | null
  title: string
  version: string
  content_sha256: string
  ots_proof_url: string | null
  ots_proof_verified: boolean
  published_at: string
}

async function loadRegulations(): Promise<Regulation[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('regulations')
    .select('id, kind, game_slug, title, version, content_sha256, ots_proof_url, ots_proof_verified, published_at')
    .order('published_at', { ascending: false })
  return (data ?? []) as Regulation[]
}

export default async function KarmaRegulationPage() {
  const regs = await loadRegulations()

  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs text-amber-400">
          <Shield className="h-3 w-3" />
          Horodatage blockchain Bitcoin — gratuit, vérifiable, perpétuel
        </div>
        <h1 className="mt-6 text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)]">
          Règlement KARMA
        </h1>
        <p className="mt-4 text-[var(--text-secondary)]">
          Tous les règlements des jeux KARMA {APP_NAME} sont horodatés via{' '}
          <a
            href="https://opentimestamps.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            OpenTimestamps <ExternalLink className="h-3 w-3" />
          </a>
          . Le hash SHA-256 est ancré dans la blockchain Bitcoin — preuve de non-falsification.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {regs.length === 0 && (
            <div className="glass rounded-2xl p-6 text-center text-[var(--text-muted)]">
              Aucun règlement publié pour l&apos;instant. Les premiers règlements KARMA seront horodatés prochainement.
            </div>
          )}
          {regs.map((r) => (
            <article key={r.id} className="glass rounded-2xl p-6">
              <header className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{r.title}</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Version {r.version} · publié le {new Date(r.published_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {r.ots_proof_verified ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Vérifié Bitcoin
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending (~1-6h)
                  </span>
                )}
              </header>
              <div className="mt-3 text-xs text-[var(--text-muted)] break-all inline-flex items-start gap-1">
                <Hash className="h-3 w-3 shrink-0 mt-0.5" />
                <code className="font-mono">sha256:{r.content_sha256}</code>
              </div>
              {r.ots_proof_url && (
                <a
                  href={r.ots_proof_url}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Télécharger preuve .ots <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </article>
          ))}
        </div>

        <section className="mt-12 glass rounded-2xl p-6">
          <h2 className="font-semibold mb-2">Comment vérifier soi-même</h2>
          <ol className="text-xs text-[var(--text-muted)] space-y-1.5 list-decimal list-inside">
            <li>Télécharge le fichier .ots ci-dessus</li>
            <li>Copie le hash SHA-256 du règlement</li>
            <li>Va sur <a className="text-amber-400 hover:underline" href="https://opentimestamps.org/">opentimestamps.org</a></li>
            <li>Upload le .ots et entre le hash — OpenTimestamps confirme le bloc Bitcoin</li>
          </ol>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Cadre légal : V4.1 §📜. {APP_NAME} ne peut pas modifier rétroactivement un règlement — le hash ne correspondrait plus. Transparence totale.
          </p>
        </section>
      </section>
    </main>
  )
}
