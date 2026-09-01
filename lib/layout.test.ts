import { describe, expect, it } from "vitest";
import { computeLayout } from "@/lib/layout";
import { genericCrm } from "@/data/presets/generic";
import { salesforceCrm } from "@/data/presets/salesforce";
import { hubspotCrm } from "@/data/presets/hubspot";

describe("computeLayout", () => {
  it("gives every object a finite {x, y}", () => {
    for (const schema of [genericCrm, salesforceCrm, hubspotCrm]) {
      const positions = computeLayout(schema);
      for (const obj of schema.objects) {
        const pos = positions[obj.name];
        expect(pos).toBeDefined();
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
      }
    }
  });

  it("is deterministic given the same input schema", () => {
    const first = computeLayout(salesforceCrm);
    const second = computeLayout(salesforceCrm);
    expect(second).toEqual(first);
  });

  it("handles a self-referencing relationship without producing NaN", () => {
    const positions = computeLayout(salesforceCrm);
    const account = positions["Account"];
    expect(Number.isFinite(account.x)).toBe(true);
    expect(Number.isFinite(account.y)).toBe(true);
  });

  it("handles a single-object schema", () => {
    const positions = computeLayout({
      name: "Solo",
      objects: [{ name: "A", fields: [{ name: "id", type: "id" }] }],
      relationships: [],
    });
    expect(Number.isFinite(positions["A"].x)).toBe(true);
    expect(Number.isFinite(positions["A"].y)).toBe(true);
  });
});
