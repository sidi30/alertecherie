# DEPLOY PLAYBOOK — AlerteCherie

> App **Expo (dev build)** serverless. Pas de VPS/backend : les pushs partent
> direct de l'app via l'API Expo Push, le routing `id → pushToken` vit dans
> Firestore. Donc ici : **EAS builds + Firebase**, pas de deploy serveur.
> Demander confirmation avant toute action **sortante** (build, submit store).
> Ne jamais committer de secret.

---

## 0. Machine (Windows) — Norton MITM le TLS

AVANT tout `npm`/`eas`/`node` réseau, exporter le CA :
- PowerShell : `$env:NODE_EXTRA_CA_CERTS="C:\Users\ramzi\.certs\norton-root.pem"`
- bash : `export NODE_EXTRA_CA_CERTS="/c/Users/ramzi/.certs/norton-root.pem"`

Sinon : `SELF_SIGNED_CERT_IN_CHAIN` / `UNABLE_TO_GET_ISSUER_CERT`.

## 1. Comptes (partagés, déjà en place)

```
Apple Team ID      : 4SRJRX4N45
Apple ID (submit)  : rsidiibrahim@gmail.com
ASC API Key ID     : D7QVR3G93J   (EAS-managed, réutilisable)
Expo account       : sidi30        (eas whoami doit = sidi30, sinon eas login)
Expo projectId     : b09a1735-f4cc-44ec-9b21-cc1ba7786678   (déjà init)
```

## 2. Per-app — état AlerteCherie

| Élément | Statut |
|---|---|
| `app.json` name/slug/owner/scheme/bundleId/package | ✅ |
| `extra.eas.projectId` + `updates.url` | ✅ (eas init fait) |
| `eas.json` profils dev/preview/preview-sim/production | ✅ |
| `eas.json` submit.ios `ascAppId` | ❌ `REMPLIR_ASC_APP_ID` → créer app dans App Store Connect |
| `play-service-account.json` (racine) | ❌ absent (gitignored) — requis submit Android |
| Firebase (cf. §5) | ❌ à faire |

## 3. Builds (npm scripts = pipeline)

```bash
# CA Norton exporté d'abord. eas-cli global : npm i -g eas-cli
npm run eas:whoami            # = sidi30

# Dev build (test sur appareil réel — push natif + son custom)
npm run build:dev:android    # APK
npm run build:dev:ios        # device ad-hoc
npm start                    # serveur dev, charge le dev build

# Test interne rapide (APK + ad-hoc iOS) — canal preview
npm run build:preview

# Store (auto-submit) — canal production
npm run build:prod:android   # Google Play track internal
npm run build:prod:ios       # TestFlight (ascAppId requis dans eas.json)
#   1er build iOS : répondre Export Compliance dans ASC (chiffrement standard → "Non")
```

> `--no-wait` : build cloud EAS. Pas de notif de fin par le harness → suivre l'URL,
> ne pas poller en boucle.

## 4. OTA vs rebuild

- `runtimeVersion = app.json version` (policy `appVersion`).
- **JS/assets seul** → `npm run ota` suffit (même runtimeVersion).
- **Module natif changé** → rebuild EAS obligatoire (OTA crasherait).
- **Gros changement** → bump `app.json version`.

## 5. Firebase — CE QUI RESTE (bloquant)

L'app ne route aucune notif tant que ça n'est pas fait.

1. **Créer projet** Firebase → console.firebase.google.com.
2. **Ajouter app Web** (`</>`) → copier l'objet `firebaseConfig`.
3. **Remplir `firebaseConfig.js`** : apiKey, authDomain, projectId,
   storageBucket, messagingSenderId, appId (placeholders `REMPLIR` actuels).
   (Clés Web = pas des secrets ; sécurité via les règles.)
4. **Firestore Database** → Créer base, mode production.
5. **Règles** → coller `firestore.rules` → Publier.
6. **Android push (FCM)** — pour que les pushs Android arrivent :
   - Firebase → Cloud Messaging activé.
   - `eas credentials -p android` → uploader la **FCM V1 service account key**
     (sinon `DeviceNotRegistered` / pas de réception Android).
7. **iOS push (APNs)** : géré par EAS via `eas credentials -p ios` (cert push).

> Durcissement optionnel (exposition du `numero` aux id devinés) : voir le bloc
> "VARIANTE DURCIE" en bas de `firestore.rules` (Auth anonyme + ownership).

## 6. Test sonneries

- Push réel **ne marche pas sur émulateur** → 2 vrais téléphones (ou ≥1 device).
- Android : à la 1re sonnerie, autoriser accès **Ne pas déranger** (bypassDnd).
- iOS : respecte le silencieux (pas de Critical Alerts) — notif standard, voulu.

## 7. Secrets — jamais committer

`firebaseConfig.js` clés Web = OK (publiques). `play-service-account.json`,
`google-services.json` → gitignored. Certs iOS / keystore Android / FCM key →
gérés par EAS. Vérifier :
```bash
git ls-files | grep -E "service-account.*\.json$|google-services\.json$|\.p8$|\.keystore$"
# doit ne RIEN renvoyer
```
