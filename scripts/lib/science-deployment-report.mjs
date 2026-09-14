// Keep failed reads distinct from a successfully read, empty migration ledger.
// Error bodies may contain request details and must never enter the report.
export function safeErrorCode(result) {
  if (!result?.error) return null;
  const code = result.error.code;
  if (code === 'request_failed' || typeof code === 'string' && /^(PGRST\d{3}|[0-9A-Z]{5})$/.test(code)) return code;
  return 'transport_or_unknown_error';
}

export function migrationChecks(expected, ledger) {
  const readable = !ledger.error && Array.isArray(ledger.data) && ledger.data.every(row => row && typeof row.name === 'string' && typeof row.sha256 === 'string');
  const applied = new Map(readable ? ledger.data.map(row => [row.name, row.sha256]) : []);
  const migrations = expected.map(m => ({name:m.name,state:!readable ? 'unavailable' : applied.get(m.name) === m.sha256 ? 'matches' : applied.has(m.name) ? 'hash_mismatch' : 'not_recorded'}));
  return {schemaReady:readable && migrations.every(m => m.state === 'matches'),ledgerError:safeErrorCode(ledger) ?? (readable ? null : 'unexpected_ledger_payload'),migrations};
}

export function countCheck(table, result) {
  const known = Number.isSafeInteger(result.count) && result.count >= 0;
  return {table,state:result.error ? 'unavailable' : known ? 'retrieved' : 'count_unknown',count:result.error || !known ? null : result.count,errorCode:safeErrorCode(result)};
}
