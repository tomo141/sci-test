// Read only. Request zero rows with the browser's public key; never print bodies or credentials.
import { writeFile } from 'node:fs/promises';
const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (origin !== 'https://grwaocjhfdberagsiiou.supabase.co' || !key) throw new Error('Expected sci-test public API configuration');
const targets = [
  { schema: 'net', table: 'http_request_queue', column: 'id' },
  { schema: 'net', table: '_http_response', column: 'id' },
  { schema: 'vault', table: 'decrypted_secrets', column: 'id' },
  { schema: 'cron', table: 'job', column: 'jobid' }
];
const results = await Promise.allSettled(targets.map(async target => {
  const url = new URL(`/rest/v1/${target.table}`, origin);
  url.searchParams.set('select', target.column);
  url.searchParams.set('limit', '0');
  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': target.schema },
    redirect: 'error', signal: AbortSignal.timeout(10000)
  });
  const body = await response.json().catch(() => null);
  return { ...target, status: response.status, schemaNotExposed: response.status === 406 && body?.code === 'PGRST106' };
}));
const checks = results.map((r, i) => r.status === 'fulfilled' ? r.value : { ...targets[i], state: 'unavailable', schemaNotExposed: null });
const report = { checkedAt: new Date().toISOString(), allSchemasExcluded: checks.every(c => c.schemaNotExposed === true), checks,
  scope: 'Data API schema exclusion using the public key; SQL role and RPC-bridge checks are separate. No rows requested.' };
await writeFile('implementation/local/deployment/job-api-boundary.json', JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify(report));
if (!report.allSchemasExcluded) process.exitCode = 1;
