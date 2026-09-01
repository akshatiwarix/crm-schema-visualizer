export type FieldType =
  | "string"
  | "number"
  | "currency"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "picklist"
  | "textarea"
  | "id";

export type SchemaField = {
  name: string;
  type: FieldType;
  required?: boolean;
  description?: string;
  /** Only meaningful when type === "picklist". */
  picklistValues?: string[];
};

export type SchemaObject = {
  /** Unique within the schema, used as the relationship key. */
  name: string;
  /** Display label, falls back to name. */
  label?: string;
  fields: SchemaField[];
};

export type RelationshipKind = "lookup" | "master-detail" | "hierarchy" | "junction";

export type SchemaRelationship = {
  /** SchemaObject.name — the "many" side. */
  from: string;
  /** SchemaObject.name — the "one" side. */
  to: string;
  /** Display badge only, no behavioral difference. */
  kind: RelationshipKind;
  /** The FK field on `from`, if worth naming. */
  fieldName?: string;
};

export type CrmSchema = {
  name: string;
  objects: SchemaObject[];
  /**
   * Every relationship is one-to-many. Self-referencing = from === to.
   * Many-to-many = a junction SchemaObject with two relationships into it,
   * kind: "junction" on both edges.
   */
  relationships: SchemaRelationship[];
};
