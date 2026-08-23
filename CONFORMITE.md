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

---

## 3. Preuve d'acceptation CGU horodatée en base — GAP PARTIEL (piège confirmé sur le parcours OAuth)

- **Signup email** (`src/app/(auth)/signup/page.tsx:68-76`) : après un `signUp()` réussi, `fetch('/api/legal/accept', ...)` est bien **appelée** (pas juste codée) pour `cgu`, `cgv`, `confidentialite` — en `Promise.all` best-effort, ne bloque pas la création de compte en cas d'échec réseau. `LegalAcceptanceNotice` (zéro case à cocher, cliquer "Créer mon compte" vaut acceptation) affichée juste au-dessus du bouton. Cohérent avec la philosophie NIYAMA (même logique que la rétractation, CLAUDE.md §9.5).
- **Signup/login Google OAuth** (`src/app/auth/callback/route.ts`) : **aucun appel à `/api/legal/accept`**. Le callback se contente de `exchangeCodeForSession(code)` puis redirige vers `/dashboard`. Un utilisateur qui s'inscrit via Google n'a **jamais** de preuve d'acceptation CGU/CGV/confidentialité enregistrée.
- `docType: 'mentions'` n'est jamais envoyé (ni au signup email ni ailleurs) — acceptable, les mentions légales ne sont pas un document à "accepter" juridiquement, seulement informatif.

**Verdict point 3 : GAP sur le parcours OAuth** (le parcours email est correct et vérifié appelé, pas juste codé).

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

---

## 9. `LegalReacceptanceGate` monté ou non — GAP CONFIRMÉ (gap quasi-universel, se répète ici aussi)

`grep -rn "LegalReacceptanceGate" src` ne retourne que :
- sa propre définition (`src/lib/legal/components/LegalReacceptanceGate.tsx`)
- son export dans `src/lib/legal/index.ts`
- une mention en commentaire JSDoc dans `versions.ts`

**Aucune page, layout ou provider de l'app ne l'importe ni ne le monte.** Le mécanisme de blocage d'usage en cas de nouvelle version de CGU/CGV/politique (calcul `docsEnAttente` côté serveur vs `CURRENT_LEGAL_VERSIONS`, gate plein écran tant que non ré-accepté) est codé mais **inactif** — un utilisateur existant ne sera jamais bloqué ni invité à ré-accepter une version mise à jour des CGU.

**Verdict point 9 : GAP confirmé — même pattern que sur les autres apps déjà auditées.**

---

## SYNTHÈSE DES GAPS

| # | Gap | Sévérité | Statut |
|---|---|---|---|
| 1 | Bandeau cookies monté (`CookieBanner`) n'est pas le bandeau NIYAMA fonctionnel — pas de granularité mesure/marketing, pas de persistance DB, `CookieConsentBanner` du socle codé mais jamais monté | Élevée | Non corrigé, décision documentée dans ERRORS.md mais non conforme |
| 2 | Signup Google OAuth n'appelle jamais `/api/legal/accept` — aucune preuve d'acceptation pour les comptes créés via OAuth | Élevée | Non corrigé |
| 3 | Tables `legal_acceptances`/`cookie_consents`/`account_deletion_requests` absentes en base → `/api/legal/accept`, `/api/account/delete`, `/api/legal/my-data`, `/dashboard/ma-memoire` cassés en production (PGRST205) | Critique | Documenté, SQL prêt, bloqué par accès réseau VPS indisponible dans ce sandbox |
| 4 | `LegalReacceptanceGate` codé mais jamais monté — aucune app ne peut forcer une ré-acceptation après bump de version | Élevée | Non corrigé |

**4 gaps.**

Points forts à noter : pages légales générées et vérifiées cohérentes avec le domaine réel (bug de copier-coller déjà corrigé), déclaration IA présente sur les 2 surfaces de chat réelles, lexique interdit à 0 occurrence, chiffres cohérents avec FACTS.md, parcours de signup email correctement câblé (pas juste codé — vérifié appelé), export RGPD et suppression de compte entièrement codés (bloqués uniquement par l'infra, pas par un oubli de code).

## VERDICT

Le socle légal est substantiellement construit et honnêtement documenté (ERRORS.md très précis, aucune fausse déclaration de conformité trouvée), mais 4 gaps concrets empêchent une conformité pleine : le bandeau cookies affiché n'est pas le bandeau conforme, le parcours OAuth échappe à la preuve d'acceptation, les fonctionnalités RGPD critiques (export/suppression/preuve) sont actuellement cassées en production faute de migration DB, et le mécanisme de ré-acceptation après mise à jour des CGU est totalement absent.

VERDICT:vida-assoc:ORANGE:4
