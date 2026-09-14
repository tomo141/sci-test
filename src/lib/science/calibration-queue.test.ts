import { describe, expect, it } from "vitest";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { calibrationQueue, type CalibrationItem, type CalibrationHistory } from "./calibration-queue";

const now = "2026-09-14T12:00:00Z";
const item = (id: string, domain: ScienceDomain = domains[0]): CalibrationItem => ({ revision_id: id, a: 1, b: 0, c: .25, focus: true, anchor: false, parameter_evidence: {}, science_items: { domain, status: "published", quality_passed: true, rights_checked: true, expires_at: null } });
const owners = (items: CalibrationItem[], count = 200) => new Map(items.map(q => [q.revision_id, new Set(Array.from({ length: count }, (_, i) => `person:${i}`))]));
const checked = (q: CalibrationItem, state = "rejected"): CalibrationHistory => ({ revision_id: q.revision_id, release_id: "parent", observed_to: "2026-09-13T12:00:00Z", state, fit: { sourceOwnerCount: 200, correctionEpoch: 0 } });

describe("calibration work allocation", () => {
  it("spends the bounded fit budget across domains instead of repeatedly evaluating the first IDs", () => {
    const bank = domains.flatMap((domain, i) => Array.from({ length: 5 }, (_, j) => item(`${i}-${j}`, domain)));
    const first = calibrationQueue(bank, owners(bank), [], "parent", false, now);
    expect(first.selected).toHaveLength(20);
    for (const domain of domains) expect(first.selected.filter(q => q.science_items.domain === domain)).toHaveLength(2);
    const next = calibrationQueue(bank, owners(bank), first.selected.map(q => checked(q)), "successor", false, now);
    expect(next.selected).toHaveLength(20);
    expect(next.selected.some(q => first.selected.includes(q))).toBe(false);
  });
  it("waits for 50 additional respondents after an unsuccessful fit, including across release changes", () => {
    const bank = [item("a")], history = [checked(bank[0])];
    expect(calibrationQueue(bank, owners(bank, 249), history, "successor", false, now).selected).toHaveLength(0);
    expect(calibrationQueue(bank, owners(bank, 250), history, "successor", false, now).selected).toHaveLength(1);
    expect(calibrationQueue(bank, owners(bank), history, "successor", false, now, 1).selected).toHaveLength(1);
  });
  it("keeps qualified candidates visible while disabled and requests fresh validation before activation", () => {
    const bank = [item("a")], history = [checked(bank[0], "qualified")];
    const paused = calibrationQueue(bank, owners(bank), history, "parent", false, now);
    expect(paused.selected).toHaveLength(0); expect(paused.awaitingActivation).toBe(1);
    expect(calibrationQueue(bank, owners(bank), history, "parent", true, now).selected).toHaveLength(1);
  });
  it("excludes anchors, non-focus, unavailable, sparse, and recently calibrated items", () => {
    const bank = [item("anchor"), item("extension"), item("held"), item("rights"), item("expired"), item("quality"), item("recent")];
    bank[0].anchor = true; bank[1].focus = false; bank[2].science_items.status = "held"; bank[3].science_items.rights_checked = false;
    bank[4].science_items.expires_at = now; bank[5].science_items.quality_passed = false; bank[6].parameter_evidence.sourceOwnerCount = 200;
    expect(calibrationQueue(bank, owners(bank), [], "parent", true, now).selected).toHaveLength(0);
    expect(calibrationQueue([item("sparse")], owners([item("sparse")], 199), [], "parent", true, now).selected).toHaveLength(0);
  });
});
