import { describe, expect, it } from "vitest";
import { conversionRate } from "@/lib/format";

describe("conversionRate", () => {
  it("is converted leads over all leads, rounded", () => {
    expect(conversionRate(["converted", "new", "lost"])).toBe(33);
  });
  it("is 0 with no leads", () => {
    expect(conversionRate([])).toBe(0);
  });
});
