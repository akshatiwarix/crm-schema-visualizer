import type { CrmSchema, FieldType, RelationshipKind, SchemaField, SchemaObject, SchemaRelationship } from "@/lib/types";

const FIELD_TYPES: FieldType[] = [
  "string",
  "number",
  "currency",
  "boolean",
  "date",
  "datetime",
  "email",
  "phone",
  "picklist",
  "textarea",
  "id",
];

const RELATIONSHIP_KINDS: RelationshipKind[] = ["lookup", "master-detail", "hierarchy", "junction"];

export type ValidateResult = { ok: true; schema: CrmSchema } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateField(raw: unknown, objectName: string, index: number): SchemaField | string {
  if (!isRecord(raw)) return `Object '${objectName}' field #${index + 1} is not an object.`;
  if (typeof raw.name !== "string" || raw.name.trim() === "") {
    return `Object '${objectName}' field #${index + 1} is missing a string 'name'.`;
  }
  if (typeof raw.type !== "string" || !FIELD_TYPES.includes(raw.type as FieldType)) {
    return `Object '${objectName}' field '${raw.name}' has invalid 'type' (got ${JSON.stringify(raw.type)}).`;
  }
  if (raw.required !== undefined && typeof raw.required !== "boolean") {
    return `Object '${objectName}' field '${raw.name}' has non-boolean 'required'.`;
  }
  if (raw.description !== undefined && typeof raw.description !== "string") {
    return `Object '${objectName}' field '${raw.name}' has non-string 'description'.`;
  }
  if (raw.picklistValues !== undefined) {
    if (!Array.isArray(raw.picklistValues) || !raw.picklistValues.every((v) => typeof v === "string")) {
      return `Object '${objectName}' field '${raw.name}' has invalid 'picklistValues' (must be a string array).`;
    }
  }
  return {
    name: raw.name,
    type: raw.type as FieldType,
    required: raw.required as boolean | undefined,
    description: raw.description as string | undefined,
    picklistValues: raw.picklistValues as string[] | undefined,
  };
}

function validateObject(raw: unknown, index: number): SchemaObject | string {
  if (!isRecord(raw)) return `Object #${index + 1} is not an object.`;
  if (typeof raw.name !== "string" || raw.name.trim() === "") {
    return `Object #${index + 1} is missing a string 'name'.`;
  }
  if (raw.label !== undefined && typeof raw.label !== "string") {
    return `Object '${raw.name}' has non-string 'label'.`;
  }
  if (!Array.isArray(raw.fields) || raw.fields.length === 0) {
    return `Object '${raw.name}' has no fields.`;
  }
  const fields: SchemaField[] = [];
  for (let i = 0; i < raw.fields.length; i++) {
    const field = validateField(raw.fields[i], raw.name, i);
    if (typeof field === "string") return field;
    fields.push(field);
  }
  return { name: raw.name, label: raw.label as string | undefined, fields };
}

function validateRelationship(raw: unknown, index: number, objectNames: Set<string>): SchemaRelationship | string {
  if (!isRecord(raw)) return `Relationship #${index + 1} is not an object.`;
  if (typeof raw.from !== "string" || raw.from.trim() === "") {
    return `Relationship #${index + 1} is missing a string 'from'.`;
  }
  if (typeof raw.to !== "string" || raw.to.trim() === "") {
    return `Relationship #${index + 1} is missing a string 'to'.`;
  }
  if (typeof raw.kind !== "string" || !RELATIONSHIP_KINDS.includes(raw.kind as RelationshipKind)) {
    return `Relationship '${raw.from}' -> '${raw.to}' has invalid 'kind' (got ${JSON.stringify(raw.kind)}).`;
  }
  if (raw.fieldName !== undefined && typeof raw.fieldName !== "string") {
    return `Relationship '${raw.from}' -> '${raw.to}' has non-string 'fieldName'.`;
  }
  if (!objectNames.has(raw.from)) {
    return `Relationship references unknown object '${raw.from}'.`;
  }
  if (!objectNames.has(raw.to)) {
    return `Relationship references unknown object '${raw.to}'.`;
  }
  return {
    from: raw.from,
    to: raw.to,
    kind: raw.kind as RelationshipKind,
    fieldName: raw.fieldName as string | undefined,
  };
}

export function validateCrmSchema(raw: unknown): ValidateResult {
  if (!isRecord(raw)) {
    return { ok: false, error: "Schema must be a JSON object with 'name', 'objects', and 'relationships'." };
  }
  if (typeof raw.name !== "string" || raw.name.trim() === "") {
    return { ok: false, error: "Schema is missing a string 'name'." };
  }
  if (!Array.isArray(raw.objects) || raw.objects.length === 0) {
    return { ok: false, error: "Schema must have a non-empty 'objects' array." };
  }
  if (!Array.isArray(raw.relationships)) {
    return { ok: false, error: "Schema must have a 'relationships' array (use [] if none)." };
  }

  const objects: SchemaObject[] = [];
  const objectNames = new Set<string>();
  for (let i = 0; i < raw.objects.length; i++) {
    const obj = validateObject(raw.objects[i], i);
    if (typeof obj === "string") return { ok: false, error: obj };
    if (objectNames.has(obj.name)) {
      return { ok: false, error: `Duplicate object name '${obj.name}'.` };
    }
    objectNames.add(obj.name);
    objects.push(obj);
  }

  const relationships: SchemaRelationship[] = [];
  for (let i = 0; i < raw.relationships.length; i++) {
    const rel = validateRelationship(raw.relationships[i], i, objectNames);
    if (typeof rel === "string") return { ok: false, error: rel };
    relationships.push(rel);
  }

  return { ok: true, schema: { name: raw.name, objects, relationships } };
}
