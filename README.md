# Daily Sales Counter

This is a separate copy of the supplied counter app. It keeps the original sales, stock, returns, expenses, supplier bills, dues, and closing features, and adds optional account-based cloud sync.

## Cloud sync setup

1. In `config.js`, set the Supabase project URL and **publishable/anon key**. These are browser-visible values; never put a `service_role` key in this app.
2. In the Supabase SQL Editor for that project, run `schema.sql`. It creates a separate table for this counter and restricts each signed-in account to its own data.
3. In Supabase Auth URL settings, set the published site as the Site URL and allow its URL as a redirect. Keep email sign-in enabled.
4. Host this folder over HTTPS as its own site. On each device, sign in with the same email address. Supabase sends a one-time sign-in link.

If cloud sync is not configured, choose **Sirf is device par use karein**. That mode uses the original browser storage and does not share data across devices.

The first cloud sign-in asks whether to import saved activity from that browser or start a new counter. If two devices edit at the same time, a version check prevents an older copy from silently overwriting newer cloud data; reload to load the latest version.

Supabase free-tier availability and limits are controlled by Supabase and can change. This folder does not publish itself or create a Supabase project.
