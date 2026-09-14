#!/usr/bin/env node
// Presence checks only. Do not report a live protection or mail test as passed here.
const pairs = [
  ['Supabase server connection', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  ['Supabase public connection', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  ['Turnstile', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY']
];
let valid = true;
for (const [name, first, second] of pairs) {
  const a = Boolean(process.env[first]), b = Boolean(process.env[second]);
  const state = a && b ? 'configured_not_live_verified' : a || b ? 'incomplete_pair' : 'not_configured';
  console.log(JSON.stringify({name, state}));
  if (a !== b || name.startsWith('Supabase') && !a) valid = false;
}
const cron = process.env.CRON_SECRET;
console.log(JSON.stringify({name:'CRON_SECRET',state:cron && cron.length >= 32 ? 'configured_not_live_verified' : cron ? 'too_short' : 'not_configured'}));
console.log(JSON.stringify({sharedRateLimiter:'requires_science_rate_limit_in_database',upstash:'not_used_by_new_science_apis',smtp:'requires_Supabase_dashboard_and_authorized_delivery_test'}));
if (cron && cron.length < 32) valid = false;
if (!valid) process.exitCode = 1;
