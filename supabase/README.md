# CareBnb — Run these queries (checklist)

1. **Enable extensions** (Supabase Dashboard → SQL Editor):
   - Run: `CREATE EXTENSION IF NOT EXISTS postgis;`
   - Run: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
   (Sometimes these are already enabled.)

2. **Apply schema**: Open `schema.sql`, copy its full contents, and paste into the Supabase SQL Editor. Run it.

3. **Auth (optional)**: To use login/signup and tie bookings to users, run `migrations/001_auth_and_intake.sql` in the SQL Editor. This adds `user_id` to `patients` and `providers`, and intake fields to `bookings`.

4. **Provider decline + referral**: Run `migrations/002_provider_decline_and_referral.sql` in the SQL Editor. This adds `declined` status to bookings, plus `decline_reason` and `referred_provider_id` for provider decline flow.

5. **Verify**: In Table Editor, confirm tables exist: `providers`, `patients`, `care_requests`, `bookings`. Check that RPCs appear under Database → Functions: `match_providers`, `match_requests`.

6. **Re-run seed (optional)**: If you need fresh demo data, you can truncate and re-run the INSERT sections of `schema.sql` (or run the whole file again; note: providers/requests will duplicate if run multiple times).

7. **Stanford doctors (optional)**: To replace all providers with data from `stanford_doctors2.csv`, run `node scripts/generate-stanford-seed.js` (or `npm run seed:stanford`) to regenerate the SQL, then run `supabase/seed_stanford_providers.sql` in the SQL Editor. This deletes all existing providers and inserts the CSV data (all doctors get `nursing` service and spread-out Stanford-area locations).
