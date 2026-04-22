# Sangha-assoc — Mobile P7.3 ship checklist

État au 2026-04-11 — `mobile/` est techniquement build-ready (tsc 0, expo-doctor 16/17, dépendances dédupliquées, bundle id corrigé). Les seuls blocages restants sont des credentials Tissma.

## Bundle ID — corrigé en P7.3 prep

Avant : `dev.purama.vida_assoc` ❌ (l'underscore est interdit dans un iOS bundle identifier)
Après : `dev.purama.vidaassoc` ✅ (valide iOS + Android, propagé dans `app.json`, `.maestro/*.yaml`, `GOOGLE_PLAY_SETUP.md`)

Le schéma Postgres `vida_assoc` n'a pas changé (ce n'est pas un bundle id).

## Credentials à fournir avant `eas init`

1. **EXPO_TOKEN** valide
   - Le token dans `~/CLAUDE.md` (`ruJtqpy756415UEEU…`) est rejeté par l'API Expo (`The bearer token is invalid`).
   - Régénérer : <https://expo.dev/settings/access-tokens> → Create → Personal access token → coller dans `~/CLAUDE.md` (clé `EXPO_TOKEN`) **et** dans `mobile/.env` si tu veux qu'il reste local.

2. **APPLE_TEAM_ID** (10 caractères, ex. `ABCD123456`)
   - <https://developer.apple.com/account> → Membership → Team ID
   - À renseigner dans `mobile/eas.json` → `submit.production.ios.appleTeamId` **et** dans `~/CLAUDE.md` (clé `APPLE_TEAM_ID`)

3. **App Store Connect — `ascAppId`**
   - Créer l'app dans App Store Connect avec bundle id `dev.purama.vidaassoc` (nom : `Sangha — Don, missions, impact`, primaire FR)
   - Récupérer le numérique `ascAppId` (visible dans l'URL ou App Information)
   - Renseigner dans `mobile/eas.json` → `submit.production.ios.ascAppId`

4. **`mobile/google-service-account.json`**
   - Procédure complète : `mobile/GOOGLE_PLAY_SETUP.md` (3 minutes, à faire 1×)
   - Le fichier est gitignoré.

## Une fois les credentials en place

```bash
cd ~/purama/vida-assoc/mobile
export EXPO_TOKEN=<nouveau token>

# 1. Créer le projet EAS (écrit extra.eas.projectId dans app.json)
npx eas-cli init --non-interactive

# 2. Vérifier que tout compile sur EAS sans surprise
npx eas-cli build:configure --non-interactive  # idempotent

# 3. Build preview (Android APK + iOS Simulator → pas besoin Apple creds)
npx eas-cli build --profile preview --platform android --non-interactive
npx eas-cli build --profile development --platform ios --non-interactive  # simulator

# 4. Quand Apple creds OK : preview iOS device → TestFlight
npx eas-cli build --profile preview --platform ios --non-interactive

# 5. Push 16 langues vers Play Console + App Store Connect
npx eas-cli metadata:push --non-interactive

# 6. Release production
npx eas-cli build --profile production --platform all --non-interactive
npx eas-cli submit --profile production --platform all --non-interactive
```

## Côté serveur — déjà fait en P7.3 prep

✅ VPS `auth.purama.dev` : `GOTRUE_URI_ALLOW_LIST` étendu à `vida://**,exp://**` + restart `supabase-auth` (vérifié `docker exec supabase-auth printenv`). Google OAuth mobile peut maintenant rejouer le callback `vida://auth/callback` côté standalone et `exp://…/--/auth/callback` en Expo Go.

## Quality gates mobile au moment du gel

- `npx tsc --noEmit` → **0 erreur**
- `npx expo-doctor` → **16/17** (le seul restant est le warning Metro `disableHierarchicalLookup` — c'est l'escape hatch documenté pour éviter que Metro ne pioche `react@19.2.4` dans les `node_modules` du Next.js parent ; le check `dup-react` qui était le vrai bug est maintenant vert)
- `grep -rE "(window|document|localStorage)\." mobile/{app,src}` → 0 violation hors fichiers gardés par `Platform.OS === "web"`
- 0 TODO / 0 console.log / 0 placeholder dans `mobile/{app,src}`
- Bundle id corrigé partout (`grep vida_assoc mobile/{app.json,.maestro,GOOGLE_PLAY_SETUP.md}` → 0)

## Smoke test recommandé après le 1er build preview

1. APK Android (preview) → `adb install` sur émulateur ou device → 5 onglets, login email, login Google (callback `vida://auth/callback`), 1 mission complete avec preuve photo+GPS, 1 ouverture Stripe Checkout, 1 retrait wallet
2. Build dev iOS simulator → Xcode simulator → mêmes scénarios sauf Stripe (Stripe ouvre Safari standalone, pas Safari du simulator)
3. Maestro : `maestro test .maestro/config.yaml` (10 flows automatisés)
