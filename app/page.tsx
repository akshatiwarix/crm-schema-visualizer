"use client";

import { useMemo, useState } from "react";
import { SchemaCanvas } from "@/app/components/SchemaCanvas";
import { presets } from "@/data/presets";
import { exampleCustomSchema } from "@/data/example-custom-schema";
import { validateCrmSchema } from "@/lib/validate-schema";
import type { CrmSchema } from "@/lib/types";

type Mode = { kind: "preset"; presetId: string } | { kind: "custom" };

export default function Home() {
  const [mode, setMode] = useState<Mode>({ kind: "preset", presetId: presets[0].id });
  const [customText, setCustomText] = useState("");
  const [customSchema, setCustomSchema] = useState<CrmSchema | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const schema: CrmSchema | null = useMemo(() => {
    if (mode.kind === "preset") {
      return presets.find((p) => p.id === mode.presetId)?.schema ?? null;
    }
    return customSchema;
  }, [mode, customSchema]);

  const highlightedNames = useMemo(() => {
    if (!schema || search.trim() === "") return undefined;
    const q = search.trim().toLowerCase();
    return schema.objects
      .filter((o) => o.name.toLowerCase().includes(q) || (o.label ?? "").toLowerCase().includes(q))
      .map((o) => o.name);
  }, [schema, search]);

  function loadCustomText(text: string) {
    setCustomText(text);
    if (text.trim() === "") {
      setCustomSchema(null);
      setCustomError(null);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setCustomError(`Invalid JSON: ${(e as Error).message}`);
      setCustomSchema(null);
      return;
    }
    const result = validateCrmSchema(parsed);
    if (!result.ok) {
      setCustomError(result.error);
      setCustomSchema(null);
      return;
    }
    setCustomError(null);
    setCustomSchema(result.schema);
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-black">
      <header className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-6 py-3 dark:border-slate-800">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">CRM Schema Visualizer</h1>
        <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setMode({ kind: "preset", presetId: p.id })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode.kind === "preset" && mode.presetId === p.id
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setMode({ kind: "custom" })}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode.kind === "custom"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Custom
          </button>
        </nav>
        <div className="ml-auto">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search objects…"
            className="w-56 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </header>

      {mode.kind === "custom" && (
        <div className="border-b border-slate-200 px-6 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadCustomText(JSON.stringify(exampleCustomSchema, null, 2))}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Load Example
            </button>
            {customError && <p className="text-sm text-rose-600 dark:text-rose-400">{customError}</p>}
          </div>
          <textarea
            value={customText}
            onChange={(e) => loadCustomText(e.target.value)}
            placeholder='Paste a CrmSchema JSON: { "name": "...", "objects": [...], "relationships": [...] }'
            spellCheck={false}
            className="mt-2 h-32 w-full resize-y rounded-md border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      )}

      <main className="min-h-0 flex-1">
        {schema ? (
          <SchemaCanvas schema={schema} highlightedNames={highlightedNames} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Paste a schema above, or click &quot;Load Example&quot;, to see the diagram.
          </div>
        )}
      </main>
    </div>
  );
}
