import { describe, expect, it } from "vitest";
import { domains, isSubdomainOf, subdomainsByDomain } from "./taxonomy";
import { questions } from "./questions";

describe("question bank", () => {
  it("defines exactly 10 subdomains for each domain with no duplicate names", () => {
    const seen = new Set<string>();
    for (const domain of domains) {
      expect(subdomainsByDomain[domain]).toHaveLength(10);
      for (const subdomain of subdomainsByDomain[domain]) {
        expect(seen.has(`${domain}/${subdomain}`)).toBe(false);
        seen.add(`${domain}/${subdomain}`);
      }
    }
    expect(seen.size).toBe(100);
  });

  it("includes 450 knowledge questions across all domains", () => {
    expect(questions).toHaveLength(450);
    for (const domain of domains) {
      expect(questions.filter((question) => question.domain === domain)).toHaveLength(45);
      expect(questions.filter((question) => question.domain === domain && question.tags.includes("知識確認"))).toHaveLength(45);
    }
  });

  it("uses canonical subdomains for every loaded question", () => {
    for (const question of questions) {
      expect(`${question.id}: ${question.domain}/${question.subdomain}`).toSatisfy(() =>
        isSubdomainOf(question.domain, question.subdomain)
      );
    }
  });
});
