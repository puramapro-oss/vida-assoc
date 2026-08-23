# CONFORMITÉ NIYAMA — vida_assoc (Sangha)

Audit réalisé le 2026-08-23, sur l'état du repo `/Users/matissdornier/purama/vida-assoc` (branche courante, socle légal fraîchement appliqué le 2026-08-23 selon ERRORS.md).
Famille déclarée dans le code : `famille: 'karma_wellness'` (`src/lib/legal/config.ts:13`). Cohérent avec le domaine réel — missions/dons associatifs récompensés en crédits + parrainage + paiement Stripe réel (`aPaiement: true`, `aChatIA: true`).

Méthode : lecture directe de chaque fichier concerné (composants, routes API, config, schema.sql, ERRORS.md). Tentative de connexion SSH VPS pour vérifier l'état réel de la base — échec confirmé (`Connection refused` port 22), corroborant le blocage déjà documenté.

---

## 1. Pages légales — PRÉSENT, contenu vérifié

| Page | Fichier | Source |
|---|---|---|
| Mentions légales | `src/app/mentions-legales/page.tsx` | `buildMentionsLegales(LEGAL_CONFIG)` |
| CGU | `src/app/cgu/page.tsx` | `buildCGU(LEGAL_CONFIG)` |
| CGV | `src/app/cgv/page.tsx` | `buildCGV(LEGAL_CONFIG)` (app `aPaiement: true` → CGV requises et présentes) |
| Politique de confidentialité | `src/app/politique-confidentialite/page.tsx` | `buildPolitiqueConfidentialite(...)` |

Les 4 pages sont générées depuis `LEGAL_CONFIG` (`src/lib/legal/config.ts`), avec `descriptionActivite` fidèle au domaine réel (missions/dons/rituels Sangha). ERRORS.md (ligne 7) documente un ancien bug corrigé le 2026-08-23 : `cgu/page.tsx` et `cgv/page.tsx` décrivaient auparavant une AUTRE app (chat multi-modèles, plans AUTOMATE/CREATE/BUILD) — corrigé, contenu actuel vérifié cohérent avec `VIDA_STRIPE_PLANS` (plans `one`/`premium`).

Médiateur de la consommation : **non souscrit à ce jour**, mais honnêtement documenté comme tel dans `src/lib/legal/company.ts:26-28` et affiché en mentions légales (`"en cours de désignation — à ce jour aucun médiateur de la consommation agréé n'est souscrit"`) plutôt que faussement déclaré. Pas un gap au sens NIYAMA (transparence correcte), mais reste un point à finaliser côté avocat/immatriculation (CNPM/FEVAD).

**Verdict point 1 : OK.**

---

## 2. Bandeau consentement cookies — GAP (piège confirmé, même famille que vida-grow-origine/raksha)

Deux composants cookies coexistent dans le repo :
- `src/components/shared/CookieBanner.tsx` — bandeau **réellement monté** dans `src/app/layout.tsx` (import ligne 4, `<CookieBanner />` dans le JSX). Fonctionnement : `localStorage.setItem('vida_cookie_consent', 'accepted'|'declined')`, 2 boutons Accepter/Refuser, **aucune catégorie granulaire** (mesure/marketing), **aucun `onConsent` branché**, **aucun appel** à `POST /api/legal/cookie-consent`.
- `src/lib/legal/components/CookieConsentBanner.tsx` — le composant NIYAMA du socle (3 choix : Tout accepter / Tout refuser / Personnaliser, `onConsent` callback, hook `useCookieConsent`). **Grep confirmé : `CookieConsentBanner` n'est importé/utilisé nulle part dans `src/` en dehors de son propre fichier et de `src/lib/legal/index.ts`** (le fichier qui l'exporte). Il n'est monté dans aucune page ni layout.
- `POST /api/legal/cookie-consent` existe (`src/app/api/legal/cookie-consent/route.ts`) mais n'est appelé par aucun composant — confirmé par grep, 0 référence hors du hook `useCookieConsent` qui le commente en JSDoc.

ERRORS.md (note en bas de fichier) documente la décision consciente : « `CookieBanner` existant conservé... `CookieConsentBanner` du socle... NON installé pour éviter un doublon de bandeau... `POST /api/legal/cookie-consent` copié quand même... mais n'est appelé par aucun composant tant que le banner existant n'est pas branché dessus — amélioration future possible, hors périmètre de cette tâche. »

C'est exactement le piège identifié sur vida-grow-origine/raksha : un bandeau cookies existe visuellement, mais il n'est pas le bandeau NIYAMA fonctionnel (pas de consentement granulaire, pas de persistance en base, pas de distinction "nécessaire" vs "mesure"/"marketing"). Décision consciente documentée ≠ conformité atteinte.

**Verdict point 2 : GAP confirmé.**

**CORRIGÉ le 2026-08-23** : `src/app/layout.tsx` monte désormais `CookieConsentBannerClient` (nouveau, `src/components/shared/CookieConsentBannerClient.tsx`) à la place de `CookieBanner`. Ce wrapper client rend `CookieConsentBanner` du socle (3 choix Tout accepter/Tout refuser/Personnaliser, catégories mesure/marketing granulaires, "nécessaire" toujours actif) et branche `onConsent` sur `POST /api/legal/cookie-consent` (fetch best-effort, n'affecte jamais la persistance localStorage déjà faite par `useCookieConsent`). `CookieBanner.tsx` (ancien décor) laissé intact sur disque mais n'est plus importé nulle part — hors périmètre de le supprimer (refactor non demandé par CONFORMITE.md).

---

## 3. Preuve d'acceptation CGU horodatée en base — GAP PARTIEL (piège confirmé sur le parcours OAuth)

- **Signup email** (`src/app/(auth)/signup/page.tsx:68-76`) : après un `signUp()` réussi, `fetch('/api/legal/accept', ...)` est bien **appelée** (pas juste codée) pour `cgu`, `cgv`, `confidentialite` — en `Promise.all` best-effort, ne bloque pas la création de compte en cas d'échec réseau. `LegalAcceptanceNotice` (zéro case à cocher, cliquer "Créer mon compte" vaut acceptation) affichée juste au-dessus du bouton. Cohérent avec la philosophie NIYAMA (même logique que la rétractation, CLAUDE.md §9.5).
- **Signup/login Google OAuth** (`src/app/auth/callback/route.ts`) : **aucun appel à `/api/legal/accept`**. Le callback se contente de `exchangeCodeForSession(code)` puis redirige vers `/dashboard`. Un utilisateur qui s'inscrit via Google n'a **jamais** de preuve d'acceptation CGU/CGV/confidentialité enregistrée.
- `docType: 'mentions'` n'est jamais envoyé (ni au signup email ni ailleurs) — acceptable, les mentions légales ne sont pas un document à "accepter" juridiquement, seulement informatif.

**Verdict point 3 : GAP sur le parcours OAuth** (le parcours email est correct et vérifié appelé, pas juste codé).

**CORRIGÉ le 2026-08-23** : `src/app/auth/callback/route.ts` appelle désormais `recordOAuthLegalAcceptance()` juste après un `exchangeCodeForSession()` réussi. Écrit `legal_acceptances` (cgu/cgv/confidentialite, upsert `onConflict: 'user_id,doc_type'`) UNIQUEMENT si l'utilisateur n'a encore AUCUNE acceptation enregistrée (`count` vérifié avant écriture) — le clic "Continuer avec Google" équivaut au clic "Créer mon compte" côté email, mais une reconnexion OAuth ultérieure après un bump de version n'écrase jamais silencieusement une acceptation : c'est `LegalReacceptanceGate` (point 4) qui prend le relais avec un clic explicite. Best-effort (try/catch), ne bloque jamais la redirection post-login.

---

## 4. « Ma mémoire » / export RGPD / suppression de compte — CODE COMPLET mais BLOQUÉ EN RUNTIME

Code applicatif présent et cohérent :
- `src/app/(dashboard)/dashboard/ma-memoire/page.tsx` — lit `legal_acceptances` (doc_type/version/accepted_at) et `account_deletion_requests` (statut/`scheduled_for`), affiche via `MaMemoirePage`.
- `GET /api/legal/my-data/route.ts` — export JSON complet (profil, acceptations, cookie_consent, referrals, conversations/messages, tables spécifiques `vida_assoc.*`).
- `POST /api/account/delete/route.ts` — programme suppression à J+30 (art. 17 RGPD), confirmation `"DELETE_MY_ACCOUNT"` requise, `DELETE` pour annuler pendant la période de grâce.

**Mais** : `legal_acceptances`, `cookie_consents`, `account_deletion_requests` sont **absentes de `schema.sql`** (grep confirmé, 0 résultat) et — selon ERRORS.md (2026-08-23, entrée 1) — la migration n'a **jamais été jouée en base** : la session qui a construit le socle n'avait pas d'accès sortant port 22 vers le VPS (`ssh root@72.62.191.111` → `Connection refused`). J'ai retenté la connexion SSH pendant cet audit : **même échec** (`Connection refused`), ce qui corrobore qu'il s'agit d'un vrai blocage réseau sandbox, pas d'un problème de credentials.

Tant que la migration n'est pas jouée : `POST /api/legal/accept`, `GET/POST/DELETE /api/account/delete`, `GET /api/legal/my-data`, et la page `/dashboard/ma-memoire` renverront `PGRST205` (« relation does not exist ») en production. `tsc` ne le détecte pas car `createServerSupabaseClient()`/`createServiceClient()` de cette app ne sont pas typés `<Database>` — le risque est runtime uniquement.

Le SQL de reprise est prêt : `docs/legal-migration-pending.sql` (124 lignes, vérifié présent) + commande exacte documentée (`docker exec -i supabase-db psql -U supabase_admin -d postgres -f /dev/stdin < ...`, GRANT explicites sur les 3 tables, `NOTIFY pgrst, 'reload schema'`).

**Verdict point 4 : GAP critique mais entièrement documenté** — code prêt, DB pas à jour, cause racine = blocage infra (voir point 8).

**CORRIGÉ le 2026-08-23** : SSH VPS re-testé au début de cette session de remédiation → **connexion réussie** (`ssh root@72.62.191.111` → `SSH_OK`) avec le mot de passe correct (`.env.secrets` → `VPS_SSH_PASSWORD`) — le refus précédent était donc bien un blocage réseau sandbox ponctuel de la session d'audit précédente, pas un problème de credentials ni un blocage infra permanent, conformément à l'hypothèse déjà documentée. Migration jouée : `docker exec -i supabase-db psql -U supabase_admin -d postgres -f /dev/stdin < docs/legal-migration-pending.sql` via SSH. Sortie confirmée : `CREATE TABLE`/`CREATE INDEX`/`ALTER TABLE`/3×`DO` par table + `GRANT`×3 + `NOTIFY` — les 3 tables existaient déjà (NOTICE "already exists, skipping" sur les 3), signe qu'une exécution antérieure non tracée avait déjà réussi ; le script étant idempotent (`CREATE TABLE IF NOT EXISTS` + policies enveloppées `EXCEPTION WHEN duplicate_object`), les GRANT et le `NOTIFY pgrst, 'reload schema'` ont malgré tout été rejoués et confirmés appliqués. Vérification indépendante post-migration : `information_schema.tables` confirme les 3 tables dans le schéma `vida_assoc`, `\d vida_assoc.legal_acceptances` confirme colonnes/contraintes/policies RLS (select/insert/update own) conformes à `docs/legal-migration-pending.sql`, et `information_schema.role_table_grants` confirme les GRANT sur `anon`/`authenticated`/`service_role`. `/api/legal/accept`, `/api/account/delete`, `/api/legal/my-data` et `/dashboard/ma-memoire` ne renverront donc plus `PGRST205` en production.

---

## 5. Déclaration IA sur chaque UI de chat — OK

Deux surfaces de chat IA réelles dans l'app :
- `src/app/(dashboard)/dashboard/chat-vida/page.tsx` (chat Sangha, streaming SSE via `/api/chat-vida`) → `<AIDisclosure appName="Sangha" />` monté ligne 110, dans le `<header>`, visible avant toute interaction.
- `src/app/aide/page.tsx` (chatbot SAV) → `AIDisclosure` également importé et utilisé.

`grep` confirme : `AIDisclosure` utilisé dans exactement ces 2 pages + son propre fichier composant. Aucune UI de chat IA sans disclosure trouvée.

**Verdict point 5 : OK.**

---

## 6. Lexique interdit / avis rémunérés / promesses de résultat — 0 occurrence

- Recherche mécanique (avis contre récompense, note contre paiement, "avis vérifié" + récompense, etc.) sur tout `src/**/*.ts(x)` : **0 occurrence**.
- Recherche "garanti"/"100% sûr"/"promet"/"guéri"/"soigne" : 3 occurrences, toutes des clauses de **non-garantie** dans les CGU/mentions légales générées par le socle (ex. `mentions-legales.ts:71` : "ne peut garantir l'absence totale d'erreurs") — négations juridiques standard, pas des promesses de résultat.
- Le don : `src/app/(dashboard)/dashboard/dons/page.tsx:94` affiche « 100 % part à l'association choisie — Sangha prend 0 % sur les dons aux autres. » — vérifié cohérent avec le code réel : `src/app/api/internal/stripe-fulfillment/route.ts:185-186` crédite `donations_received_cents`/`balance_cents` de l'association avec `session.amount_total` (montant Stripe intégral, aucune déduction de commission trouvée dans ce handler). Affirmation vérifiée, pas une promesse en l'air.

**Verdict point 6 : OK, 0 occurrence.**

---

## 7. Chiffres cohérents avec FACTS.md — OK

- `WALLET_MIN` : FACTS.md = 5€. Code : `src/lib/constants.ts:83` → `export const WALLET_MIN_WITHDRAWAL = 5 // euros`. **Cohérent.**
- Split KARMA 50/10/40 : cette app **n'implémente pas ce modèle localement**, documenté explicitement dans `src/app/api/cron/reconcile/route.ts:7,142` (« vida_assoc n'a PAS de split KARMA 50/10/40 local... cette app n'implémente pas ce modèle localement (prime + parrainage uniquement) »). Ce n'est pas une incohérence : c'est un choix de périmètre assumé et documenté, pas un chiffre inventé ou contradictoire.
- Parrainage/prime : `src/app/api/internal/stripe-fulfillment/route.ts:79` → `primeCents = isFirst ? min(50% du montant, plafond 10€) : 5% récurrent` et `commissionCents = 50%` du montant (ligne 106). Cohérent avec la résolution verrouillée CLAUDE.md §9.2 (PARRAINAGE V4 : N1 = 50% premier paiement).

**Verdict point 7 : OK.**

---

## 8. Migration SQL — documentée dans ERRORS.md, blocage infra confirmé

ERRORS.md (2026-08-23, 1ère entrée) documente précisément : tables non créées, cause = sandbox sans accès sortant port 22 (pas un problème de credentials, `VPS_SSH_PASSWORD` correct), SQL prêt dans `docs/legal-migration-pending.sql`, commande de reprise exacte fournie (rôle `supabase_admin`, GRANT explicites requis car un schéma pré-existant n'hérite pas des `ALTER DEFAULT PRIVILEGES` — référence `PIEGES.md §16`).

Vérification indépendante pendant cet audit : nouvelle tentative SSH → `Connection refused` sur le port 22, confirmant que le blocage est réel et toujours actif à la date de l'audit (pas une excuse non vérifiable).

**Verdict point 8 : Format respecté (ERRORS.md correctement rempli), blocage réel et corroboré — mais la conséquence (point 4) reste un gap tant que la migration n'est pas rejouée depuis un environnement avec accès VPS.**

**CORRIGÉ le 2026-08-23** : voir détail complet au point 4 — accès VPS retrouvé dans cette session, migration jouée et vérifiée.

---

## 9. `LegalReacceptanceGate` monté ou non — GAP CONFIRMÉ (gap quasi-universel, se répète ici aussi)

`grep -rn "LegalReacceptanceGate" src` ne retourne que :
- sa propre définition (`src/lib/legal/components/LegalReacceptanceGate.tsx`)
- son export dans `src/lib/legal/index.ts`
- une mention en commentaire JSDoc dans `versions.ts`

**Aucune page, layout ou provider de l'app ne l'importe ni ne le monte.** Le mécanisme de blocage d'usage en cas de nouvelle version de CGU/CGV/politique (calcul `docsEnAttente` côté serveur vs `CURRENT_LEGAL_VERSIONS`, gate plein écran tant que non ré-accepté) est codé mais **inactif** — un utilisateur existant ne sera jamais bloqué ni invité à ré-accepter une version mise à jour des CGU.

**Verdict point 9 : GAP confirmé — même pattern que sur les autres apps déjà auditées.**

**CORRIGÉ le 2026-08-23** : nouveau wrapper `src/components/shared/LegalReacceptanceGateClient.tsx` monte `LegalReacceptanceGate` du socle, câblé dans `src/app/(dashboard)/layout.tsx` (converti en Server Component `async`). `docsEnAttente` est calculé côté serveur (`getDocsEnAttente()`) via `computeDocsEnAttente()` du socle, en comparant `legal_acceptances` de l'utilisateur connecté à `CURRENT_LEGAL_VERSIONS` — `mentions` explicitement exclu du calcul (ce n'est pas un document à "accepter" juridiquement, cf point 3). **Fail-open assumé** : si la requête `legal_acceptances` échoue (table absente, réseau) le gate ne s'affiche PAS (`docsEnAttente = []`) plutôt que de bloquer faussement tout le monde — décision nécessaire tant que le point 4 n'était pas corrigé, reste la bonne posture par défaut (un faux positif "bloque toute l'app" serait pire qu'un gap de conformité). Le clic "J'ai lu, je continue" déclenche `POST /api/legal/accept` (même route que le signup) ; un échec réseau affiche "L'enregistrement a échoué, réessaie." (géré par le composant du socle lui-même) au lieu de valider silencieusement.

---

## SYNTHÈSE DES GAPS

| # | Gap | Sévérité | Statut |
|---|---|---|---|
| 1 | Bandeau cookies monté (`CookieBanner`) n'est pas le bandeau NIYAMA fonctionnel — pas de granularité mesure/marketing, pas de persistance DB, `CookieConsentBanner` du socle codé mais jamais monté | Élevée | **CORRIGÉ 2026-08-23** — `CookieConsentBannerClient` monté dans `layout.tsx`, `onConsent` → `POST /api/legal/cookie-consent` |
| 2 | Signup Google OAuth n'appelle jamais `/api/legal/accept` — aucune preuve d'acceptation pour les comptes créés via OAuth | Élevée | **CORRIGÉ 2026-08-23** — `auth/callback/route.ts` écrit `legal_acceptances` (cgu/cgv/confidentialite) à la toute première connexion OAuth |
| 3 | Tables `legal_acceptances`/`cookie_consents`/`account_deletion_requests` absentes en base → `/api/legal/accept`, `/api/account/delete`, `/api/legal/my-data`, `/dashboard/ma-memoire` cassés en production (PGRST205) | Critique | **CORRIGÉ 2026-08-23** — migration jouée via VPS (accès SSH retrouvé), 3 tables + RLS + GRANT vérifiés en base |
| 4 | `LegalReacceptanceGate` codé mais jamais monté — aucune app ne peut forcer une ré-acceptation après bump de version | Élevée | **CORRIGÉ 2026-08-23** — monté dans `(dashboard)/layout.tsx` via `LegalReacceptanceGateClient`, fail-open si `legal_acceptances` illisible |

**4/4 gaps corrigés.** `npx tsc --noEmit` = 0 erreur après corrections. `npm run build` échoue — mais confirmé **pré-existant et sans lien** (`Module not found: Can't resolve 'uuid/v4'` via `javascript-opentimestamps`→`request`, déjà documenté dans ERRORS.md avant cette session ; reproduit à l'identique après `git stash` des 5 fichiers de cette remédiation, donc pas causé par ces corrections). Conformément à la règle "commit seulement si tsc+build verts", **ces corrections ne sont pas commitées** — le blocage build est un chantier séparé (dépendance `opentimestamps`/`uuid`), hors périmètre NIYAMA de cet audit.

Points forts à noter : pages légales générées et vérifiées cohérentes avec le domaine réel (bug de copier-coller déjà corrigé), déclaration IA présente sur les 2 surfaces de chat réelles, lexique interdit à 0 occurrence, chiffres cohérents avec FACTS.md, parcours de signup email correctement câblé (pas juste codé — vérifié appelé), export RGPD et suppression de compte entièrement codés (bloqués uniquement par l'infra, pas par un oubli de code).

## VERDICT

Le socle légal est substantiellement construit et honnêtement documenté (ERRORS.md très précis, aucune fausse déclaration de conformité trouvée), mais 4 gaps concrets empêchent une conformité pleine : le bandeau cookies affiché n'est pas le bandeau conforme, le parcours OAuth échappe à la preuve d'acceptation, les fonctionnalités RGPD critiques (export/suppression/preuve) sont actuellement cassées en production faute de migration DB, et le mécanisme de ré-acceptation après mise à jour des CGU est totalement absent.

VERDICT:vida-assoc:ORANGE:4

---

## MISE À JOUR — REMÉDIATION 2026-08-23

Les 4 gaps ci-dessus ont été corrigés (détail par point ci-dessus, entrées "**CORRIGÉ le 2026-08-23**"). Résumé :
1. Bandeau cookies NIYAMA (`CookieConsentBanner` du socle) monté et câblé à `POST /api/legal/cookie-consent`.
2. Signup Google OAuth écrit une preuve d'acceptation horodatée à la première connexion.
3. Migration SQL (`legal_acceptances`/`cookie_consents`/`account_deletion_requests`) jouée en base sur le VPS — accès SSH retrouvé (mot de passe `.env.secrets` correct, le refus précédent était un blocage réseau sandbox ponctuel) — et vérifiée (tables, RLS, GRANT).
4. `LegalReacceptanceGate` monté dans le layout dashboard, fail-open par conception si l'état légal ne peut pas être vérifié.

`npx tsc --noEmit` : 0 erreur. `npm run build` : échec confirmé **pré-existant et sans lien** avec ces corrections (dépendance `javascript-opentimestamps`→`request`→`uuid/v4` manquante, déjà documentée dans ERRORS.md avant cette session ; reproduit à l'identique après `git stash` du code de remédiation puis restauré). Conformément à la règle "commit seulement si tsc+build verts", **les corrections NIYAMA ci-dessus sont prêtes dans l'arbre de travail mais non commitées** — à commiter dès que le blocage build `opentimestamps`/`uuid` (hors périmètre NIYAMA) sera traité séparément.

VERDICT:vida-assoc:VERT:0 (4/4 gaps NIYAMA corrigés — build bloqué par un chantier séparé et pré-existant, non commité)
