-- Run after 001_dashboard_schema.sql
-- Seeds initial debt balances. User must be signed in first —
-- replace 'YOUR-USER-ID-HERE' with your actual auth.users id
-- (find it in Supabase: Authentication → Users → copy the UUID)

-- After first sign-in, run this in SQL editor:
/*
insert into debts (user_id, debt_id, name, bal, rate, min_payment, due_day, autopay, sort_order) values
  ('YOUR-USER-ID-HERE', 'td',       'TD First Class ···6932',  21854, 11.00, 228, 6,  false, 1),
  ('YOUR-USER-ID-HERE', 'amex',     'Amex Cobalt ···1700',     4296,  21.99, 89,  18, false, 2),
  ('YOUR-USER-ID-HERE', 'scotia',   'Scotiabank Visa ···3026', 2906,  13.99, 42,  6,  false, 3),
  ('YOUR-USER-ID-HERE', 'tang_loc', 'Tangerine LOC ···6380',   2713,  9.45,  76,  21, true,  4),
  ('YOUR-USER-ID-HERE', 'tang_mc',  'Tangerine MC ···6704',    2501,  20.95, 52,  24, false, 5)
on conflict (user_id, debt_id) do nothing;
*/

-- Instructions:
-- 1. Deploy the app and sign in once (magic link)
-- 2. Go to Supabase → Authentication → Users → copy your UUID
-- 3. Paste it above replacing YOUR-USER-ID-HERE
-- 4. Remove the /* and */ comment markers
-- 5. Run in SQL editor
