import { loadPublishedQuestionsFromDb } from "@/src/lib/data/loadQuestions";
import { domains } from "@/src/lib/data/taxonomy";

export async function getBankHealthData() {
  const observedAt = new Date().toISOString();
  try {
    const bank = await loadPublishedQuestionsFromDb();
    return { state: "available" as const, observedAt,
      rows: domains.map((domain) => {
        const items = bank.filter((item) => item.domain === domain);
        return { domain, published: items.length, withSource: items.filter((item) => item.sourceUrl || item.sourceNote).length };
      }) };
  } catch {
    return { state: "unavailable" as const, observedAt, rows: [] };
  }
}
