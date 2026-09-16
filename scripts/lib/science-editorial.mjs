import { createHash } from 'node:crypto';
import { editorialHints } from '../../src/lib/science/editorial-review.ts';
export const editorialDigest = content => createHash('sha256').update(JSON.stringify(content)).digest('hex');
export function editorialRegressions(rows, known = []) {
  const existing = new Set(known.map(r => `${r.key}:${r.digest}`));
  return rows.filter(row => editorialHints(row.content).some(h => h.severity === 'high') && !existing.has(`${row.legacyId ?? row.familyKey}:${editorialDigest(row.content)}`));
}
