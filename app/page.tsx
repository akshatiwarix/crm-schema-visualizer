import { SchemaCanvas } from "@/app/components/SchemaCanvas";
import { genericCrm } from "@/data/presets/generic";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">CRM Schema Visualizer</h1>
      </header>
      <main className="min-h-0 flex-1">
        <SchemaCanvas schema={genericCrm} />
      </main>
    </div>
  );
}
