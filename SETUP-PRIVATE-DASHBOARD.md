# Set up Ash's private birthday dashboard and email alerts

**Status:** GitHub contains the website and backend source. This is NOT live until you connect Supabase and Resend. No answer is sent unless the visitor chooses categories, reviews them, enters the invite code, checks consent, and presses Send.

## 1. Create Supabase and its private tables

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor** and run the SQL file at supabase/migrations/202611260001_private_responses.sql.
3. In Supabase Project Settings / API Keys, copy the **Project URL** and **publishable key** (sb_publishable_...). These are safe browser values when Row Level Security is enabled.
4. Edit the public GitHub file response-config.js. Fill its supabaseUrl and publishableKey fields. Do not put any secret API keys, Resend key, private email or invite code there.

## 2. Enable Ash-only dashboard login

1. In Supabase Authentication / URL Configuration, allow this exact redirect URL:
   https://notharsha674.github.io/trishi/ash-dashboard.html
2. Enable Email (magic link/OTP) in Authentication / Providers.
3. Open the dashboard URL and request a sign-in email. Complete the emailed link.
4. In Authentication / Users, find your newly created user UUID.
5. In SQL Editor run the statement below, replacing YOUR-AUTH-USER-UUID:

    insert into public.ash_dashboard_owners(owner_id)
    values ('YOUR-AUTH-USER-UUID')
    on conflict (owner_id) do nothing;

6. Refresh the dashboard. Other signed-in people will have no access because the database RLS policies read the owner UUID.

Default Supabase Auth emails may have limited recipients; set up SMTP if needed for production.

## 3. Deploy the Supabase Edge Function

The repository contains supabase/functions/submit-birthday/index.ts and supabase/config.toml.

From a local clone of the GitHub project, with Node.js 20+ and terminal:

    npm install -D supabase
    npx supabase login
    npx supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
    npx supabase functions deploy submit-birthday --no-verify-jwt

Alternatively, open the Supabase Edge Functions editor and paste index.ts. Allow public invocation for this one function ONLY. It uses the server-side code, a private invite code and validation to prevent arbitrary submissions. Dashboard data reads still require email sign-in and owner-only RLS.

## 4. Add private secrets in Supabase (NEVER in GitHub)

Go to Supabase Dashboard / Edge Functions / Secrets and set:

- SUBMISSION_INVITE_CODE = a strong random secret of at least 16 characters, given privately to Trishi.
- RESEND_API_KEY = your private key from https://resend.com.
- ALERT_TO_EMAIL = your own receiving email address.
- ALERT_FROM_EMAIL = a sender address on a verified Resend domain.

If using onboarding@resend.dev for early testing, Resend only delivers to the email address registered on your Resend account. To email other inboxes, verify your own domain.

The function saves the selected results even if email sending is not configured. The private dashboard then shows email status as not sent.

## 5. Test end-to-end

1. Open https://notharsha674.github.io/trishi/.
2. Play the Fun Zone games or answer quiz questions.
3. Select **Send results to Ash** from the Fun Zone footer or Menu.
4. Check the categories you want to share, review exactly what is shown, enter the private code and check the consent box.
5. Press **Send selected results to Ash**.
6. Sign in at https://notharsha674.github.io/trishi/ash-dashboard.html and press Refresh. Verify the answers, scores and email status.

If the website says submissions are not connected, check response-config.js. If your invite code fails, check the function secret. If the dashboard works but email does not, check Resend secret, verified sender and recipient.

## Privacy and safety

- Only intentionally checked categories are submitted, after a separate consent checkbox and a Send click.
- Private notes-to-self, images, location, device identifiers, email address, and browsing history are not uploaded by the website.
- The backend stores selected choices/scores/rating, timestamp, random submission ID and notification status. It does not store IP addresses in the app database; hosting providers may retain ordinary service logs.
- Public visitors cannot read/write the database tables directly. Only the Supabase Edge Function can insert, and only the signed-in owner UUID can read them.
- The server requires a private code, validates payload length and caps accepted submissions at 25 per rolling 24 hours. A long, unguessable code is essential.
- This is a personal site, not a hardened public survey. Add more anti-abuse controls before sharing the invite code widely.

## Official guides

Supabase Magic Links: https://supabase.com/docs/guides/auth/auth-email-passwordless
Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
Supabase Edge Functions: https://supabase.com/docs/guides/functions/auth
Supabase and Resend: https://supabase.com/docs/guides/functions/examples/send-emails
