# Firebase deployment guide

## Projects

| Environment | Firebase plan | Project ID | Purpose |
|-------------|---------------|------------|---------|
| Dev | Spark emulators | `coal-trading-app` | Local emulators + integration tests |
| Prod | Blaze | `coal-trading-app` | Cloud Run, Storage, Hosting, Scheduler |

Region: **asia-south1** (Mumbai).

## One-time GCP / Firebase setup (prod)

1. Create Firebase project in [Firebase Console](https://console.firebase.google.com).
2. Upgrade to **Blaze** (billing required for Cloud Run, Storage, Scheduler).
3. Enable APIs: Cloud Run, Cloud Scheduler, Secret Manager, Firestore, Cloud Storage.
4. Create Firestore database (Native mode, `asia-south1`).
5. Storage bucket: `coal-trading-app.firebasestorage.app` (auto-created when Storage is enabled).
6. Create backup bucket: `coal-trading-app-backups`.
7. Store secrets in Secret Manager:
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - Service account JSON for Admin SDK (or use Cloud Run default SA with IAM roles).

## Local development (Spark emulators)

```bash
cd firebase
npm install -g firebase-tools
firebase login
firebase emulators:start --import=./emulator-data --export-on-exit
```

Backend `.env`:

```
DATABASE_PROVIDER=firestore
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
FIREBASE_PROJECT_ID=coal-trading-app
```

## Deploy Cloud Run API

```bash
cd backend
gcloud run deploy tradecrm-api \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_PROVIDER=firestore,FIREBASE_PROJECT_ID=coal-trading-app,FIREBASE_STORAGE_BUCKET=coal-trading-app.firebasestorage.app \
  --set-secrets JWT_ACCESS_SECRET=JWT_ACCESS_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest \
  --min-instances 1 \
  --memory 1Gi \
  --timeout 300
```

## Deploy Hosting (frontend + API rewrite)

```bash
npm run build:frontend
cd firebase
firebase use prod
firebase deploy --only hosting
```

## Deploy backup Cloud Function + Scheduler

```bash
cd firebase/functions
npm install
cd ..
firebase deploy --only functions
# Configure Cloud Scheduler to POST to backup function monthly (see functions/README.md)
```

## Client access

- **Browser:** `https://coal-trading-app.web.app`
- **Electron client mode:** set `remoteApiUrl` to Hosting URL in `settings.json`

See [FIREBASE_PROJECT.md](./FIREBASE_PROJECT.md) for project-specific setup (service account, env file).

See [FIREBASE_CUTOVER.md](./FIREBASE_CUTOVER.md) for migration and rollback.
