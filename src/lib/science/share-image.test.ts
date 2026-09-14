import { describe, it, expect } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { domains } from "@/src/lib/data/taxonomy";
import { definition } from "./definition";
import { scoreResponses } from "./model";
import { coverImage, sharedResultImage } from "./share-image";

describe("PNG share rendering", () => {
  it("renders actual 1200x630 PNGs for total, domain, weekly, lab and the landing page", async () => {
    for (const kind of ["trial", "domain", "weekly", "lab", "cover"] as const) {
      const exam = definition(kind === "cover" ? "trial" : kind, kind === "domain" ? "情報・計算機科学" : undefined);
      const result = { ...scoreResponses(domains.flatMap(domain => Array.from({ length: kind === "domain" ? domain === exam.domain ? 20 : 0 : 2 }, (_, i) => ({ a: 1, b: 0, c: .25, correct: i % 3 !== 0, eligible: exam.formal, domain })))), definition: exam, answerCount: exam.count, correctCount: 7 };
      const response = kind === "cover" ? await coverImage() : await sharedResultImage({ id: "image-test", nickname: "科学好きのテスト参加者です長い名前", result, competitive: true, completedAt: "2026-09-14T00:00:00Z" });
      expect(response.headers.get("Content-Type")).toBe("image/png");
      const data = Buffer.from(await response.arrayBuffer());
      expect(data.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(data.readUInt32BE(16)).toBe(1200);
      expect(data.readUInt32BE(20)).toBe(630);
      if (process.env.SCIENCE_SAVE_IMAGE_FIXTURES === "1") {
        await mkdir("implementation/local/share-images", { recursive: true });
        await writeFile(`implementation/local/share-images/${kind}.png`, data);
      }
    }
  }, 30000);
});
