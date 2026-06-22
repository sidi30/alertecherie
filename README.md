# AlerteCherie 🔔

App mobile **React Native / Expo (dev build)** ultra simple : faire sonner le
téléphone de tes proches. Aucun compte, aucun email, aucun login.

Chaque utilisateur génère un **identifiant court** (6 caractères) à partager. Les
autres l'ajoutent pour pouvoir le faire sonner. Tout est local (AsyncStorage) +
un mini-mapping `identifiant → expoPushToken` dans **Firestore** pour router les
notifications. Les pushs partent **directement de l'app** via l'API Expo Push
(pas de backend à coder).

---

## ⚠️ iOS vs Android (silencieux / Ne pas déranger)

- **Android** : canal `IMPORTANCE_MAX` + son custom + `bypassDnd: true` → sonne
  même en silencieux / Ne pas déranger (l'utilisateur doit accorder l'accès à la
  politique DND).
- **iOS** : Apple **interdit** de contourner le silencieux sans l'entitlement
  *Critical Alerts* (réservé/validé par Apple). Aucun hack. Sur iOS la sonnerie
  passe donc en **notification standard** qui respecte le mode silencieux. C'est
  volontaire et conforme aux règles.

---

## Stack

Expo SDK 52 · expo-notifications · expo-av · expo-linking · expo-clipboard ·
expo-device · AsyncStorage · Firebase (Firestore JS SDK) · share sheet natif.

## Structure

```
alertcherie/
├─ App.js                     # orchestrateur (onboarding / home / alarme + listeners notif)
├─ index.js                   # entry point
├─ app.json                   # config Expo (plugins notif + son, permissions)
├─ eas.json                   # profils build/submit EAS
├─ firebaseConfig.js          # >>> À REMPLIR <<< clés Firebase Web
├─ firestore.rules            # règles Firestore à coller dans la console
├─ scripts/gen-alarm.js       # génère assets/alarm.wav
├─ assets/alarm.wav           # son d'alarme bundlé (généré)
└─ src/
   ├─ firebase.js             # registerSelf / lookupUser / idExists
   ├─ theme.js
   ├─ lib/
   │  ├─ id.js                # génération identifiant court
   │  ├─ storage.js           # AsyncStorage (self + contacts)
   │  ├─ notifications.js     # permissions + canal Android + push token
   │  ├─ push.js              # envoi via API Expo Push
   │  └─ alarm.js             # play/stop son en boucle
   ├─ components/
   │  ├─ ContactCard.js
   │  ├─ HoldToRing.js        # appui maintenu 1,5 s (anti-erreur)
   │  └─ AddContactModal.js
   └─ screens/
      ├─ OnboardingScreen.js
      ├─ HomeScreen.js
      └─ AlarmScreen.js
```

---

## 1. Config Firebase (à remplir)

1. [Console Firebase](https://console.firebase.google.com) → **Créer un projet**.
2. **Ajouter une application Web** (`</>`) → copie l'objet `firebaseConfig`.
3. Colle les valeurs dans **`firebaseConfig.js`** (apiKey, projectId, etc.).
   > Ces clés Web ne sont pas des secrets : la sécurité vient des règles.
4. **Firestore Database** → *Créer une base* (mode production).
5. Onglet **Règles** → colle le contenu de `firestore.rules` → Publier.

## 2. Installer + lancer (dev build, pas Expo Go)

```bash
# CA Norton d'abord (cette machine) :
export NODE_EXTRA_CA_CERTS="/c/Users/ramzi/.certs/norton-root.pem"

npm install
npm run gen-alarm           # (re)génère le son si besoin

npx eas-cli login           # compte sidi30
npx eas-cli init            # remplit projectId + updates.url dans app.json
```

> `expo-notifications` + son custom = **module/asset natif** → il faut un **dev
> build** (Expo Go ne suffit pas).

```bash
# Build dev internes (pour tester sur appareil réel) :
npx eas-cli build --profile development --platform android   # APK
npx eas-cli build --profile development --platform ios       # device ad-hoc

# Puis lancer le serveur de dev :
npm start
```

## 3. Tester les sonneries

- Le push réel **ne marche pas sur émulateur** → tester sur **2 vrais
  téléphones** (ou ≥1 device + un envoi manuel).
- Sur Android, à la 1re sonnerie reçue, autoriser l'accès **Ne pas déranger** si
  demandé (pour `bypassDnd`).

## 4. Builds de distribution

```bash
# Android (Play track internal)
npx eas-cli build --platform android --profile production --auto-submit --non-interactive --no-wait

# iOS (TestFlight) — renseigner d'abord ascAppId dans eas.json
npx eas-cli build --platform ios --profile production --auto-submit --non-interactive --no-wait
```

À compléter avant submit :
- `eas.json` → `submit.production.ios.ascAppId` (ID App Store Connect de l'app).
- `play-service-account.json` à la racine (Google Play, gitignored).

## 5. Mises à jour OTA (JS uniquement)

```bash
npx eas-cli update --channel production --platform all -m "fix"
```
⚠️ Si tu ajoutes/changes un **module natif** → **rebuild** obligatoire (l'OTA
crasherait). Bump `version` dans `app.json` pour les gros changements.

---

## Notes de conception

- **Pas d'auth** : l'identifiant 6 caractères (~887M combinaisons sans
  caractères ambigus) sert d'écran. Pour durcir : Auth anonyme Firebase +
  ownership dans les règles.
- **Geste anti-erreur** : « Faire sonner » exige un appui maintenu ~1,5 s
  (anneau de progression), pas un simple tap.
- **Réception** : notif → l'app ouvre `AlarmScreen` et joue `alarm.wav` en
  boucle jusqu'au bouton **Arrêter**.
