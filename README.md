# Daily Sales Counter

This is a separate copy of the supplied counter app. It keeps the original sales, stock, returns, expenses, supplier bills, dues, and closing features, and adds optional account-based cloud sync.

## Cloud sync setup

1. In the Supabase project for this counter, run `schema.sql` in the SQL Editor. It creates a separate table and restricts each signed-in account to its own data.
2. In the GitHub repository's **Settings → Secrets and variables → Actions**, add the repository variable `DAILY_SALES_SUPABASE_URL` with the project URL (for this project: `https://vnywethlofoeyytdhdxc.supabase.co`) and the repository secret `DAILY_SALES_SUPABASE_PUBLISHABLE_KEY` with the **Publishable key** from Supabase Settings → API Keys. Do not use the Supabase secret/service-role key.
3. Re-run the **Publish Daily Sales Counter** workflow from the repository's Actions tab. It writes the config only into the deployment artifact; the key is not committed to the source repository. A publishable key is visible to website visitors by design, so the table's row-level security is essential.
4. In Supabase Auth URL settings, enable email sign-in, set the Site URL to `https://foryoutrade20-png.github.io/daily-sales-counter-website/`, and allow that URL as a redirect.
5. On each device, sign in with the same email address. Supabase sends a one-time sign-in link.

If cloud sync is not configured, choose **Sirf is device par use karein**. That mode uses the original browser storage and does not share data across devices.

The first cloud sign-in asks whether to import saved activity from that browser or start a new counter. If two devices edit at the same time, a version check prevents an older copy from silently overwriting newer cloud data; reload to load the latest version.

Supabase free-tier availability and limits are controlled by Supabase and can change. This folder does not publish itself or create a Supabase project.
