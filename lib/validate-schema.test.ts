import { describe, expect, it } from "vitest";
import { validateCrmSchema } from "@/lib/validate-schema";
import { genericCrm } from "@/data/presets/generic";
import { salesforceCrm } from "@/data/presets/salesforce";

describe("validateCrmSchema", () => {
  it("accepts a valid preset-shaped schema", () => {
    const result = validateCrmSchema(genericCrm);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.schema.objects).toHaveLength(genericCrm.objects.length);
      expect(result.schema.relationships).toHaveLength(genericCrm.relationships.length);
    }
  });

  it("accepts a self-referencing + junction schema (Salesforce preset)", () => {
    const result = validateCrmSchema(salesforceCrm);
    expect(result.ok).toBe(true);
  });

  it("rejects a non-object payload", () => {
    const result = validateCrmSchema([1, 2, 3]);
    expect(result.ok).toBe(false);
  });

  it("rejects a schema missing 'objects'", () => {
    const result = validateCrmSchema({ name: "Bad", relationships: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/objects/i);
  });

  it("rejects a schema missing 'relationships'", () => {
    const result = validateCrmSchema({ name: "Bad", objects: [{ name: "A", fields: [{ name: "id", type: "id" }] }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/relationships/i);
  });

  it("rejects an object with zero fields", () => {
    const result = validateCrmSchema({
      name: "Bad",
      objects: [{ name: "Empty", fields: [] }],
      relationships: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/no fields/i);
  });

  it("rejects a field with an invalid type", () => {
    const result = validateCrmSchema({
      name: "Bad",
      objects: [{ name: "A", fields: [{ name: "id", type: "not-a-real-type" }] }],
      relationships: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/invalid 'type'/i);
  });

  it("rejects a relationship referencing an unknown object", () => {
    const result = validateCrmSchema({
      name: "Bad",
      objects: [{ name: "A", fields: [{ name: "id", type: "id" }] }],
      relationships: [{ from: "A", to: "Ghost", kind: "lookup" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unknown object 'Ghost'/);
  });

  it("rejects a relationship with an invalid kind", () => {
    const result = validateCrmSchema({
      name: "Bad",
      objects: [
        { name: "A", fields: [{ name: "id", type: "id" }] },
        { name: "B", fields: [{ name: "id", type: "id" }] },
      ],
      relationships: [{ from: "A", to: "B", kind: "one-to-one" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/invalid 'kind'/i);
  });

  it("rejects duplicate object names", () => {
    const result = validateCrmSchema({
      name: "Bad",
      objects: [
        { name: "A", fields: [{ name: "id", type: "id" }] },
        { name: "A", fields: [{ name: "id", type: "id" }] },
      ],
      relationships: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/duplicate/i);
  });

  it("accepts a self-referencing relationship (from === to)", () => {
    const result = validateCrmSchema({
      name: "Ok",
      objects: [{ name: "A", fields: [{ name: "id", type: "id" }] }],
      relationships: [{ from: "A", to: "A", kind: "hierarchy" }],
    });
    expect(result.ok).toBe(true);
  });
});
