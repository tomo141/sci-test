import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadTaxonomy(root = process.cwd()) {
  const source = readFileSync(join(root, "src/lib/data/taxonomy.ts"), "utf8");
  const domainsBlock = source.match(/export const domains = \[([\s\S]*?)\] as const;/)?.[1];
  const domains = [...domainsBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const subdomains = {};
  const objectBlock = source.match(/export const subdomainsByDomain = \{([\s\S]*?)\} as const satisfies/)?.[1];

  for (const domain of domains) {
    const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:"${escaped}"|${escaped}): \\[([^\\]]+)\\]`);
    const block = objectBlock.match(re)?.[1];
    subdomains[domain] = block ? [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  }

  return { domains, subdomains };
}

export function taxonomyPairs(taxonomy) {
  return taxonomy.domains.flatMap((domain) =>
    (taxonomy.subdomains[domain] ?? []).map((subdomain) => ({ domain, subdomain }))
  );
}
