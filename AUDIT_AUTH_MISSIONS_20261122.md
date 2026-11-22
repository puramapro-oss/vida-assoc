# VIDA-ASSOC — authentification et soumission des preuves

État du 22 novembre 2026 : **PASS pour les contrôles ciblés ; PARTIEL pour le parcours complet.**

## Référence et problème

Source : `main`, commit `6a75072a6678694320655f4c5a427080d38aad79`, arbre `3fb2ef2a655d2ba7ee12ddb4f6700c0777d68da2`. Les travaux existants et l'identité Sangha sont conservés.

Le callback OAuth acceptait une destination externe fournie dans `next`. Le dépôt d'une photo pouvait aussi produire un score artificiel suffisant pour marquer la mission comme validée et payée, avant des écritures de récompense dont les erreurs étaient ignorées. La politique d'insertion des preuves ne réservait pas les champs de validation au serveur.

## Correction

- Le callback n'accepte que des chemins locaux après normalisation, refuse les destinations ambiguës et utilise `/dashboard` en repli. Une erreur fournisseur, un code absent ou une exception renvoient vers la connexion. Les réponses ne sont pas mises en cache. La logique existante d'acceptation des textes légaux est conservée.
- La route de soumission conserve le chemin de stockage `vida-proofs` utilisé par le client, enregistre la preuve avec `pending`, `human_review_needed=true`, aucun score fabriqué et aucune déclaration de paiement. Elle n'exécute aucune attribution de crédit.
- Les erreurs de recherche ou d'insertion sont explicites, sans détails internes. Les doublons, y compris l'erreur d'unicité `23505`, produisent un conflit 409.
- La migration `migrations/20261122_mission_submission_guard.sql` et le bootstrap réservent l'insertion utilisateur à une preuve non validée et non payée. Les données historiques sont conservées. Les droits de revue du serveur restent disponibles.
- L'interface annonce une vérification à venir. Elle ne promet plus une validation automatique inexistante.

## Vérification

| Contrôle | Résultat et portée |
|---|---|
| Callback | 31/31 tests, vraie route et vraies réponses Next.js 16.3.0 ; frontières Supabase simulées |
| Soumission de mission | 23/23 tests sur le vrai handler ; appels de base simulés |
| Migration et droits | 17/17 tests sur SQL réellement exécuté dans PGlite 0.5.17 ; rôles limités, témoins négatifs, données historiques et réapplication |
| Ensemble final | **71/71 PASS**, zéro échec ou saut |
| TypeScript | PASS pour le callback, la route de mission et la page de mission avec leurs imports |
| ESLint | PASS sur les fichiers modifiés et les tests, zéro erreur ou avertissement |
| Diff | PASS, aucun fichier existant supprimé |

Le callback initial échouait à 21 des 30 scénarios alors définis. La soumission initiale échouait à 19 des 23 scénarios. Le 31e test du callback vérifie les en-têtes de cache sur succès et erreurs.

Un premier essai PostgreSQL standalone ne permettait pas de qualifier l'application de RLS : un témoin négatif laissait passer une opération interdite. Cette observation n'est pas utilisée comme preuve. Les 17 tests PGlite ont ensuite vérifié de vrais refus, ainsi que les opérations légitimes. Ils utilisent la table canonique, la politique de lecture existante et des rôles de test ; ils ne qualifient pas l'intégralité du schéma ou l'authentification Supabase réelle.

Les runtimes sont des copies locales préexistantes, sans nouvelle installation : Next 16.3.0, TypeScript 5.9.3 et PGlite 0.5.17. Framer Motion 12.23.19 est réutilisé pour vérifier le libellé de la page. Le verrou applicatif reste inchangé ; une installation propre de ce verrou et le build de l'application complète ne sont pas qualifiés par ce lot.

Pour rejouer les tests avec les dépendances applicatives disponibles :

```sh
node --test tests/auth-callback.test.mjs tests/mission-submission.test.mjs
PGLITE_MODULE_PATH=/chemin/vers/@electric-sql/pglite node --test tests/mission-submission-rls.test.mjs
```

`PGLITE_MODULE_PATH` est facultatif si ce paquet est déjà installé dans le runtime de test. Aucune clé ou connexion à une base réelle n'est nécessaire.

## Limites et activation

Le service de vérification des preuves, la revue humaine et le règlement atomique des récompenses restent à qualifier. Le présent lot empêche de les présenter comme déjà exécutés. Il n'invente pas de validateur ou de règle de paiement.

La migration doit être revue puis appliquée à la base propriétaire confirmée avant toute mise en service. Aucune migration réelle, aucun crédit, compte, email, déploiement ou paiement n'a été effectué dans cette qualification. Le retour OAuth réel, les parcours sur navigateur natif, les performances et les autres fonctions de l'application restent **NON TESTÉS** ici.

La branche `fix/vida-assoc-auth-mission-integrity-20261122` est destinée à une demande de fusion en brouillon. Son déploiement automatique Vercel est désactivé uniquement pour cette branche, selon la [configuration Git officielle](https://vercel.com/docs/project-configuration/git-configuration). Le code ne constitue pas une mise en production.
