import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import BottomTabBar from '@/components/layout/BottomTabBar'
import OnboardingFlow from '@/components/shared/OnboardingFlow'
import AffirmationModal from '@/components/shared/AffirmationModal'
import LegalReacceptanceGateClient from '@/components/shared/LegalReacceptanceGateClient'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { computeDocsEnAttente } from '@/lib/legal/versions'
import type { LegalDocType } from '@/lib/legal/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const docsEnAttente = await getDocsEnAttente()

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <main className="min-h-[calc(100vh-4rem)] p-4 pb-20 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>
      <BottomTabBar />
      <OnboardingFlow />
      <AffirmationModal />
      <LegalReacceptanceGateClient docsEnAttente={docsEnAttente} />
    </div>
  )
}

/**
 * Fail-open : si `legal_acceptances` n'existe pas encore en base (migration non jouée,
 * cf CONFORMITE.md point 3/8) ou toute autre erreur, on NE bloque PAS l'utilisateur avec
 * un faux positif "tout est en attente" — on masque simplement le gate tant que l'état
 * réel ne peut pas être vérifié. `mentions` est exclu : ce n'est pas un document à
 * "accepter" juridiquement (cf CONFORMITE.md point 3), il ne doit jamais apparaître ici.
 */
async function getDocsEnAttente(): Promise<LegalDocType[]> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('legal_acceptances')
    .select('doc_type, version')
    .eq('user_id', user.id)
  if (error || !data) return []

  const dernieresAcceptations = Object.fromEntries(
    data.map((row) => [row.doc_type, row.version])
  ) as Partial<Record<LegalDocType, string>>

  return computeDocsEnAttente(dernieresAcceptations).filter((doc) => doc !== 'mentions')
}
