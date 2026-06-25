# Firebase cutover and rollback

## Pre-cutover checklist

- [ ] Blaze project created (`asia-south1`)
- [ ] `npm run validate:parity` passes on staging
- [ ] Restore drill completed on dev Firestore
- [ ] Cloud Run deployed with `DATABASE_PROVIDER=firestore`
- [ ] Firebase Hosting deployed with `/api` rewrite
- [ ] Electron clients have `remoteApiUrl` documented
- [ ] Postgres hot standby backup taken (`pg_dump` zip)
- [ ] Budget alerts configured in GCP

## Cutover (maintenance window ~2–4 hours)

1. Announce downtime to users.
2. Stop writes on office server (stop Node / Electron server mode).
3. Run final delta migration:
   ```bash
   cd backend
   DATABASE_URL=postgresql://... DATABASE_PROVIDER=firestore \
     FIREBASE_PROJECT_ID=coal-trading-app \
     npm run migrate:postgres-to-firestore
   ```
4. Run parity validation — **abort if any FAIL**:
   ```bash
   npm run validate:parity
   ```
5. Deploy Cloud Run + Hosting:
   ```bash
   gcloud run deploy tradecrm-api --source backend --region asia-south1
   cd firebase && firebase deploy --only hosting,functions
   ```
6. Smoke test: login, purchase confirm, sale confirm, payment, document upload, backup.
7. Update Electron `settings.json` on each client:
   ```json
   { "deployMode": "client", "remoteApiUrl": "https://coal-trading-app.web.app" }
   ```
8. Monitor Cloud Run logs for 48 hours.

## Rollback

If critical failure within 30 days:

1. Redeploy Cloud Run with `DATABASE_PROVIDER=postgres` and last `DATABASE_URL`.
2. `firebase hosting:rollback`
3. Point Electron clients back to office server URL.
4. Restore Postgres from last local backup zip if needed.

Keep Docker Postgres running **30 days** post-cutover as hot standby.

## Post-cutover (after 30 days stable)

- Archive final Postgres dump + Firestore export to local PC.
- Optional: decommission office server Postgres.
- Update [ARCHITECTURE.md](./ARCHITECTURE.md) and [SHARED_DATABASE.md](./SHARED_DATABASE.md).
