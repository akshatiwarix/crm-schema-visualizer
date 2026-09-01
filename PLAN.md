# Day 032 — CRM Schema Visualizer — Implementation Plan

> This file is the contract. It was settled before any code was written, through a
> structured grilling session, and it is not a starting point to improve on. If the
> code contradicts this file, the code is wrong. If this file needs to change, it
> changes here first, in writing, with the reason.

**Repo:** `crm-schema-visualizer` · **Day:** 032 of 100 · **Time limit:** one session (~2-4 hrs)
**Brief (fixed by the master plan):** *A visualizer that turns CRM objects and
relationships into an understandable data model.*
**Portfolio angle:** Schema reasoning, developer tooling, CRM architecture.

---

## Problem

A CRM's data model is invisible. Anyone integrating with a CRM, onboarding onto a
team's instance, or evaluating a platform has to reconstruct the object graph —
which objects exist, which fields they carry, how they relate — by clicking through
admin screens or reading API docs object-by-object. There's no single picture of
"here is the shape of this CRM," so the same reverse-engineering happens over and
over, by hand.

### What this repo is not

- **Not an editor.** Read-only viewer. No adding/removing objects, fields, or
  relationships in the browser.
- **Not connected to a live CRM.** No OAuth, no real API introspection. Built-in
  presets are hand-authored, hard-coded JSON approximating real CRM object models;
  custom schemas come from a pasted JSON blob, not a live connection.
- **Not a full ER-modeling tool.** No indexes, no constraints beyond
  required/optional, no multi-schema (namespaces/packages) support.
- **Not connected to any other day's code.** Standalone repo, no shared module.
- **No export, no diagram-as-image download, no persisted node positions across
  reloads.** Cut for time; listed under Post-MVP below.

---

## Intended user

A developer, RevOps engineer, or solutions architect who wants to see — at a
glance — the objects, fields, and relationships that make up a CRM's data model,
either from one of a few recognizable presets or from their own schema.

## User journey

1. Land on the page: Generic CRM preset loaded by default, diagram already laid
   out and rendered.
2. Switch presets (Generic / Salesforce-style / HubSpot-style) via a top-bar
   selector — diagram re-renders with a fresh auto-layout.
3. Or choose "Custom" — paste a JSON schema (or click "Load Example" to see the
   expected shape) — diagram renders from that instead. Malformed JSON or an
   invalid schema shape shows a specific inline error instead of a blank/broken
   diagram.
4. Read each object box: name, its field list (`name: type`, required fields
   marked), inline.
5. Click an object box: its direct relationships highlight (connected edges +
   neighbor boxes); everything else dims. Click again / click empty canvas to
   clear.
6. Hover an edge: tooltip shows the relationship's type/cardinality.
7. Drag a box to reposition it if the auto-layout overlaps or reads poorly.
8. Scroll to zoom, drag empty canvas to pan, for schemas wider than the viewport.
9. Type in the search box: matching object(s) highlight using the same
   highlight/dim mechanism as a click.

---

## User-selected MVP scope

- Read-only schema visualizer, three built-in presets + custom JSON paste input.
- Presets: Generic B2B CRM, Salesforce-style, HubSpot-style.
- Relationships modeled with one primitive — one-to-many — reused three ways:
  a plain one-to-many (lookup), a self-referencing one-to-many (hierarchy, e.g.
  Account → Parent Account), and many-to-many represented as a real junction
  object box with two one-to-many edges into it (e.g. Contact → CampaignMember
  ← Campaign). No separate many-to-many edge type.
- ER-style object boxes: name header + inline field list (`name: type`, required
  flag bold/marked); field description/picklist values (if present) shown in a
  hover tooltip, not inline.
- Node-to-node SVG edges (not per-field-row), each carrying a small
  cardinality/type badge.
- Auto-layout via `d3-force`, then draggable per-box override (in-session only,
  not persisted).
- Click a node → highlight direct relationships, dim rest. Hover an edge →
  tooltip. Search box → same highlight/dim mechanism.
- Scroll-to-zoom + drag-to-pan on the canvas.
- Custom JSON input: paste into a textarea + "Load Example" button. Hand-rolled
  validator distinguishes JSON syntax errors from schema-shape errors (e.g. a
  relationship referencing an unknown object name), with a specific message for
  each.

## User-selected stack

Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript + vitest — matches every
prior day's repo. One added dependency: `d3-force`, used only to compute node
positions (same use as `crm-duplicate-graph`, Day 018). No diagram/graph UI
framework (no React Flow) — boxes, edges, and interactions are hand-rolled
SVG/Tailwind.

## User-selected data sources

Three hard-coded preset schemas, committed as JSON, approximating real CRM
object models (not pulled from any live API). Custom schemas come from
user-pasted JSON at runtime, validated client-side.

## User-selected time limit

One session, ~2-4 hours.

## User-selected deployment target

Vercel. GitHub repo `akshatiwarix/crm-schema-visualizer`, public.

---

## System / architecture plan

- `lib/types.ts` — `SchemaField`, `SchemaObject`, `SchemaRelationship`,
  `CrmSchema` domain types shared by presets, the validator, layout, and UI.
- `data/presets/generic.ts`, `data/presets/salesforce.ts`,
  `data/presets/hubspot.ts` — hand-authored `CrmSchema` objects, typed against
  `lib/types.ts`, committed as source (no fetch/build step).
- `lib/validate-schema.ts` — pure function `validateCrmSchema(raw: unknown):
  { ok: true; schema: CrmSchema } | { ok: false; error: string }`. Two failure
  classes with distinct messages: JSON parse failure (from `JSON.parse` in the
  caller) vs. structural failure (missing field, wrong type, relationship
  pointing at an object name that doesn't exist) caught here. This is the
  function vitest covers most heavily.
- `lib/layout.ts` — pure-ish function `computeLayout(schema: CrmSchema):
  Record<objectName, { x: number; y: number }>` wrapping a `d3-force`
  simulation (link force keyed by relationship, charge force for spacing,
  center force), run to convergence synchronously (`simulation.stop()` +
  manual `tick()` loop, not the animated `d3.forceSimulation` ticker) so it's a
  deterministic pure function vitest can assert shape/no-NaN on, not a
  React-driven animation loop.
- `app/page.tsx` — client component: preset/custom selector state, textarea +
  "Load Example" + validation error display, renders `<SchemaCanvas>` with the
  resolved `CrmSchema`.
- `app/components/SchemaCanvas.tsx` — client component: owns computed layout
  (from `lib/layout.ts`, then per-box drag overrides in local state), zoom/pan
  transform state, selected/highlighted node state, search-match state. Renders
  an `<svg>` with `<ObjectBox>` per object and edge `<path>`s.
- `app/components/ObjectBox.tsx` — one object's box: header + field rows,
  drag handlers, dimmed/highlighted visual state via props.
- `app/components/EdgeLine.tsx` — one relationship's connector line + type
  badge + hover tooltip, dimmed/highlighted visual state via props.
- No backend/API routes, no database. Everything is client-side: presets are
  static imports, custom schemas are validated and laid out in the browser.

## Data model

`lib/types.ts`:

```ts
type FieldType =
  | "string" | "number" | "currency" | "boolean" | "date" | "datetime"
  | "email" | "phone" | "picklist" | "textarea" | "id";

type SchemaField = {
  name: string;
  type: FieldType;
  required?: boolean;
  description?: string;
  picklistValues?: string[]; // only meaningful when type === "picklist"
};

type SchemaObject = {
  name: string;          // unique within the schema, used as the relationship key
  label?: string;         // display label, falls back to name
  fields: SchemaField[];
};

type RelationshipKind = "lookup" | "master-detail" | "hierarchy" | "junction";

type SchemaRelationship = {
  from: string;           // SchemaObject.name — the "many" side
  to: string;             // SchemaObject.name — the "one" side
  kind: RelationshipKind; // display badge only, no behavioral difference
  fieldName?: string;     // the FK field on `from`, if worth naming
};

type CrmSchema = {
  name: string;           // preset/custom schema display name
  objects: SchemaObject[];
  relationships: SchemaRelationship[]; // every relationship is one-to-many;
    // self-referencing = from === to; many-to-many = a junction SchemaObject
    // with two relationships into it, kind: "junction" on both edges.
};
```

Preset content (object/field counts are a ceiling, may trim during authoring
for diagram readability):

- **Generic B2B CRM**: Account, Contact, Deal, Activity — ~4 objects.
- **Salesforce-style**: Account (self-referencing ParentId), Contact, Opportunity,
  Lead, Case, Campaign, CampaignMember (junction: Contact × Campaign) — ~7 objects.
- **HubSpot-style**: Company, Contact, Deal, Ticket — ~4 objects.

## Main states and workflows

- **Default state**: Generic preset loaded, no selection, no search, layout at
  initial computed positions, zoom at 1.0.
- **Preset switch**: layout recomputed from scratch for the new schema; any
  selection/search/drag-override state clears.
- **Custom — empty**: textarea empty, canvas shows a prompt to paste JSON or
  click "Load Example," no diagram rendered.
- **Custom — invalid JSON**: `JSON.parse` throws → error banner: "Invalid JSON:
  <native message>."
- **Custom — invalid schema shape**: parses, fails `validateCrmSchema` → error
  banner naming the specific problem (e.g. "Relationship references unknown
  object 'Foo'.", "Object 'Bar' has no fields.").
- **Custom — valid**: renders exactly like a preset.
- **Node selected**: clicked box + its direct relationships/neighbors at full
  opacity, everything else dimmed. Selecting a different node replaces the
  selection; clicking the selected node or empty canvas clears it.
- **Search active**: matching object name(s) highlighted via the same
  dim mechanism as selection; clearing the search box clears the highlight.
- **Dragging a box**: overrides that box's `{x, y}` in local state only, edges
  connected to it redraw live; not persisted past the session/reload.
- **Zoom/pan**: canvas-level SVG transform; doesn't affect underlying layout
  coordinates.

## Implementation task order

1. Scaffold Next.js app (match sibling repos' package.json versions), Tailwind,
   TypeScript, vitest, eslint. Init git, GitHub repo, first commit, push. — done
2. This PLAN.md (contract), committed before implementation code. Push.
3. `lib/types.ts` domain types + `data/presets/*.ts` (three hand-authored
   presets). Commit, push.
4. `lib/validate-schema.ts` + vitest tests (valid schema, bad JSON shape, unknown
   relationship reference, missing required shape). Commit, push.
5. `lib/layout.ts` (`d3-force` wrapper) + vitest tests (every object gets a
   finite `{x,y}`, deterministic given the same input). Commit, push.
6. `app/components/ObjectBox.tsx` + `EdgeLine.tsx` + `SchemaCanvas.tsx`: static
   render of a preset (no interaction yet). Commit, push.
7. Canvas interaction: drag-to-reposition, zoom/pan, click-to-highlight,
   hover tooltip. Commit, push.
8. `app/page.tsx`: preset selector, custom textarea + "Load Example" + error
   display, search box wired to highlight. Commit, push.
9. README.md per master template, with screenshots. Commit, push.
10. Deploy to Vercel, verify live URL. Commit any deploy config if needed, push.
11. Update the master plan's progress tracker to `[x]` for Day 032 (outside this
    repo, on Desktop).

## Validation / test plan

- vitest unit tests on `lib/validate-schema.ts`: valid preset-shaped schema
  passes; malformed JSON shape (missing `objects`/`relationships` keys) fails
  with a specific message; relationship referencing a nonexistent object name
  fails with a specific message; object with zero fields fails.
- vitest unit tests on `lib/layout.ts`: every object in the schema receives a
  finite, non-NaN `{x, y}`; running twice on the same input schema produces the
  same positions (deterministic).
- Manual pass in browser: load each of the 3 presets, confirm diagram renders
  and reads correctly; paste a valid custom schema, confirm it renders; paste
  invalid JSON and a structurally-invalid schema, confirm distinct clear error
  messages; click a node and confirm highlight/dim; hover an edge and confirm
  tooltip; drag a box and confirm it moves and edges follow; zoom/pan; type in
  search and confirm highlight.

## Deployment plan

`vercel deploy` (preview), then promote to production once the manual pass is
clean. No environment variables needed — fully static, client-side, no secrets.

## README plan

Follow the master plan's Reusable README Structure. Key Decisions & Tradeoffs
section covers: why every relationship reduces to one primitive (one-to-many)
instead of modeling many-to-many/self-referencing as distinct edge types, why
presets are hand-authored instead of pulled from a live CRM API, why node
positions aren't persisted across reloads.

## Definition of done

- All 3 presets render correctly; custom JSON paste renders a valid schema and
  gives specific errors for the two invalid cases.
- Click-to-highlight, hover tooltip, drag-to-reposition, zoom/pan, and search
  all work on every preset.
- vitest suite passes.
- Deployed to Vercel, live URL works.
- README.md complete per template.
- Progress tracker in the master plan file updated to `[x]` for Day 032.

## Post-MVP ideas (not built now)

- Export the diagram as a PNG/SVG image.
- Live CRM API introspection (Salesforce/HubSpot OAuth) instead of hand-authored
  presets.
- Editable schema builder (add/edit/delete objects, fields, relationships).
- Persist dragged node positions (e.g. to `localStorage`) across reloads.
- Field-row-level edges (connect the exact FK field row to the target object,
  not just box-to-box).
