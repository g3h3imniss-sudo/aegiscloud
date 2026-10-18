# Cloudflare R2 setup

The app's R2 S3-compatible client requires a Cloudflare account ID, bucket,
and R2 Access Key ID/Secret Access Key. Create an R2 API token with
**Object Read & Write**, scoped to only the application bucket. Do not expose
these credentials to browser code.

Set the following Vercel environment variables (or local `.env.local` values):

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

The app uses `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`,
and signed download URLs. Bucket privacy and API-token scope are configured in
Cloudflare, not by this app.
For a jurisdictional bucket, also set `CLOUDFLARE_R2_JURISDICTION` to `eu`,
`fedramp`, or `us`; the default bucket endpoint is used when this is unset.

## Optional object event feed

R2 event notifications deliver messages to Cloudflare Queues. The Worker in
[`../cloudflare/r2-events/worker.js`](../cloudflare/r2-events/worker.js)
forwards each queue message to the app's authenticated
`/api/rdr/events` endpoint.

1. Create the source queue and dead-letter queue:

   ```sh
   npx wrangler queues create aegiscloud-rdr-events
   npx wrangler queues create aegiscloud-rdr-events-dlq
   ```

2. Edit `APP_URL` in
   [`../cloudflare/r2-events/wrangler.toml`](../cloudflare/r2-events/wrangler.toml)
   to the deployed app origin without a trailing slash.
3. Set `RDR_EVENT_TOKEN` in Vercel and as a Worker secret. Generate a distinct
   random secret of at least 32 characters:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   npx wrangler secret put RDR_EVENT_TOKEN --config cloudflare/r2-events/wrangler.toml
   ```

4. Deploy the consumer Worker:

   ```sh
   npx wrangler deploy --config cloudflare/r2-events/wrangler.toml
   ```

5. Create notification rules for both object creation/overwrite and deletion:

   ```sh
   npx wrangler r2 bucket notification create YOUR_BUCKET --event-type object-create --queue aegiscloud-rdr-events
   npx wrangler r2 bucket notification create YOUR_BUCKET --event-type object-delete --queue aegiscloud-rdr-events
   ```

The Worker acknowledges queue messages only after the app returns success.
Failed deliveries are retried and eventually sent to the configured dead-letter
queue. Inspect that queue and Worker logs operationally; the app does not send
alerts. Event receipt requires the Supabase schema to have been applied.

R2 event notifications and the Worker are optional. Without them, operators can
still manually scan against a baseline. Neither path restores or deletes data.
