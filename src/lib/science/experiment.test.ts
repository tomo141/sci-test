import { describe,expect,it } from "vitest";
import { allocationCheck,wilson } from "./experiment";
describe("experiment uncertainty",()=>{
  it("does not turn missing observations into a zero conversion estimate",()=>{expect(wilson(0,0)).toBeNull();expect(wilson(0,100)?.high).toBeGreaterThan(0);expect(wilson(100,100)?.low).toBeLessThan(1);});
  it("detects severe allocation imbalance and leaves balanced groups unflagged",()=>{expect(allocationCheck([100,100,100,100])?.p).toBeCloseTo(1);expect(allocationCheck([250,50,50,50])?.alert).toBe(true);expect(allocationCheck([1,1,1,1])).toBeNull();});
});
