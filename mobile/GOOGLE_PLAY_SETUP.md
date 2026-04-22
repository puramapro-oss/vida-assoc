# Google Play Setup — Sangha Association

3 minutes de clics, une seule fois. Une fois fait, `eas submit --platform android --profile production` se débrouille seul à chaque release.

Bundle Android : `dev.purama.vidaassoc`
Listing par défaut : `fr-FR` (16 traductions chargées via `store.config.json`).

---

## 1. Créer l'app dans Play Console (45 secondes)

1. Ouvre <https://play.google.com/console>
2. **Toutes les apps → Créer une appli**
3. Renseigne :
   - Nom : **Sangha — Don, missions, impact**
   - Langue par défaut : **Français (France)**
   - App ou jeu : **Application**
   - Gratuite ou payante : **Gratuite**
4. Coche les deux cases (politique développeur + lois US) → **Créer**

---

## 2. Lier le bundle ID (10 secondes)

Va dans **Configuration de l'app → Détails de l'app**, et confirme :

- Nom de l'application : `Sangha — Don, missions, impact`
- Catégorie : **Style de vie**
- Catégorie secondaire : **Réseaux sociaux**

L'`applicationId` est défini dans `mobile/app.json` (`android.package = dev.purama.vidaassoc`). Le premier `eas submit` créera automatiquement le track `production`.

---

## 3. Service account Google (90 secondes)

EAS doit pouvoir publier sans intervention. On lui donne un compte de service `editor` sur l'app.

1. Dans Play Console → **Configuration → API access**
2. **Lier un projet Google Cloud → Créer un projet → Lier**
3. **Service account → Créer un nouveau compte de service → Google Cloud Console**
   - Nom : `eas-vida-publisher`
   - Rôle : **Service Account User**
4. Sur le compte créé → **Manage keys → Add key → JSON** → télécharger
5. Renomme le fichier `google-service-account.json` et place-le à la racine de `mobile/`
6. **De retour dans Play Console** : sur la ligne `eas-vida-publisher@…` → **Grant access → Inviter** :
   - Permissions de l'app : `All apps` désactivé, sélectionne **Sangha — Don, missions, impact**
   - Cocher : **Release manager** (lit/écrit tracks + publish)
7. **Inviter l'utilisateur**

> ⚠️ `mobile/google-service-account.json` est dans `.gitignore`. Ne jamais le commit.

---

## 4. Renseigner les credentials EAS (20 secondes)

Le fichier `mobile/eas.json` contient déjà :

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",
      "track": "production",
      "releaseStatus": "completed"
    }
  }
}
```

Aucune config supplémentaire à ajouter, EAS lit le JSON automatiquement.

---

## 5. Pousser le listing 16 langues (5 secondes)

Tous les titres / descriptions / mots-clés sont dans `mobile/store.config.json` (clé `android.listings`).

```bash
cd mobile
eas metadata:push   # idempotent, pousse les 16 langues vers Play Console
```

À la prochaine release, EAS attache automatiquement le listing courant.

---

## 6. Premier upload (signature locale gérée par EAS)

```bash
cd mobile
eas build --profile production --platform android        # build .aab signé via EAS
eas submit --profile production --platform android        # upload + release production
```

EAS Build crée la keystore Android et la conserve dans son cloud (`eas credentials` pour l'inspecter). Tu n'as **rien à signer manuellement**.

---

## 7. À partir de la 2ᵉ release : workflow automatique

Le workflow `mobile/.eas/workflows/full-deploy.yaml` se déclenche à chaque `git push origin main` :

```
prebuild_check → build_ios + build_android → submit_ios + submit_android → ota_update
```

> Tu n'as plus jamais à toucher Play Console. Les release notes par langue viennent de `store.config.json` (`releaseNotes`).

---

## Checklist 1ère soumission

- [ ] App créée dans Play Console
- [ ] Bundle ID confirmé : `dev.purama.vidaassoc`
- [ ] Compte de service `eas-vida-publisher` créé + JSON téléchargé
- [ ] `mobile/google-service-account.json` en place (et hors git)
- [ ] Compte de service invité comme **Release manager** sur l'app
- [ ] `eas metadata:push` exécuté → 16 langues poussées
- [ ] `eas build --profile production --platform android` → .aab OK
- [ ] `eas submit --profile production --platform android` → release `production` créée
- [ ] Play Console → **Politique de l'app** : 100 % renseigné (formulaire data safety + content rating + target audience)
