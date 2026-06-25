# Firebase project: coal-trading-app

Your Firebase web config (client SDK) maps to backend env as follows:

| Web SDK field | Backend / deploy use |
|---------------|----------------------|
| `projectId: "coal-trading-app"` | `FIREBASE_PROJECT_ID=coal-trading-app` |
| `storageBucket: "coal-trading-app.firebasestorage.app"` | `FIREBASE_STORAGE_BUCKET=coal-trading-app.firebasestorage.app` |
| `authDomain: "coal-trading-app.firebaseapp.com"` | Add to `CORS_ALLOWED_ORIGINS` |
| Hosting URL | `https://coal-trading-app.web.app` |
| `apiKey`, `appId`, `measurementId` | **Not used by Express API** — only if you add client Firebase SDK + Analytics later |

## Important: two different Firebase setups

This ERP uses **Firebase Admin SDK on the server** (Cloud Run / local Node), not the browser `initializeApp()` snippet in the Firebase getting-started page.

```
Browser / Electron  →  Express /api  →  Admin SDK  →  Firestore + Storage
```

You do **not** need to paste the web config into the React app for database access. The frontend already calls `/api/*` via RTK Query.

## Quick setup

### 0. Service account (done if `backend/serviceAccountKey.json` exists)

Copy your downloaded JSON to `backend/serviceAccountKey.json` (gitignored). `backend/.env` is already configured.

Verify:

```bash
npm run setup:firebase
```

### 1. Create Firestore (required — one-time in Console)

Spark alone cannot deploy Storage, Cloud Functions, or Cloud Run integrations. Enable **Blaze** for production; emulators work on Spark for local dev.

Open: https://console.firebase.google.com/project/coal-trading-app/firestore → **Create database** → Native mode → **asia-south1**.

Also enable **Storage** in the Console (Build → Storage).

### 2. Migrate Postgres data

```bash
npm run setup:firebase -- --migrate
```

Your local Postgres has data (5 users). This copies everything to Firestore.

### 3. Restart desktop app

Quit the running Electron app, then:

```bash
npm run start:desktop
```

The app now uses Firestore (`DATABASE_PROVIDER=firestore` in `backend/.env`).

### 4. Upgrade to Blaze (production deploy)

```bash
npm run build:frontend
gcloud run deploy tradecrm-api --source backend --region asia-south1 \
  --set-env-vars DATABASE_PROVIDER=firestore,FIREBASE_PROJECT_ID=coal-trading-app,FIREBASE_STORAGE_BUCKET=coal-trading-app.firebasestorage.app
cd firebase && firebase use prod && firebase deploy
```

### 5. Electron client mode

```json
{
  "deployMode": "client",
  "remoteApiUrl": "https://coal-trading-app.web.app"
}
```

Or:

```bash
TRADECRM_MODE=client TRADECRM_REMOTE_API_URL=https://coal-trading-app.web.app npm run start:desktop
```

## Security note

The `apiKey` in the web config is **public by design** (it identifies the project, not a secret). Never commit `serviceAccountKey.json` or JWT secrets.
