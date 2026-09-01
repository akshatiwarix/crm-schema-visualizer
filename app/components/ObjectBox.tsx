import type { SchemaObject } from "@/lib/types";
import { BOX_WIDTH, HEADER_HEIGHT, ROW_HEIGHT, boxHeight } from "./box-geometry";

type ObjectBoxProps = {
  object: SchemaObject;
  x: number;
  y: number;
};

export function ObjectBox({ object, x, y }: ObjectBoxProps) {
  const height = boxHeight(object);
  const left = x - BOX_WIDTH / 2;
  const top = y - height / 2;

  return (
    <g transform={`translate(${left}, ${top})`}>
      <rect
        width={BOX_WIDTH}
        height={height}
        rx={8}
        className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-700"
        strokeWidth={1.5}
      />
      <rect width={BOX_WIDTH} height={HEADER_HEIGHT} rx={8} className="fill-slate-800 dark:fill-slate-700" />
      <rect y={HEADER_HEIGHT / 2} width={BOX_WIDTH} height={HEADER_HEIGHT / 2} className="fill-slate-800 dark:fill-slate-700" />
      <text
        x={12}
        y={HEADER_HEIGHT / 2 + 5}
        className="fill-white text-[13px] font-semibold"
      >
        {object.label ?? object.name}
      </text>
      {object.fields.map((field, i) => (
        <text
          key={field.name}
          x={12}
          y={HEADER_HEIGHT + i * ROW_HEIGHT + 15}
          className={`text-[12px] font-mono ${field.required ? "fill-slate-900 font-semibold dark:fill-slate-100" : "fill-slate-600 dark:fill-slate-400"}`}
        >
          {field.name}
          <tspan className="fill-slate-400 dark:fill-slate-500">: {field.type}</tspan>
          {field.required ? <tspan className="fill-rose-500"> *</tspan> : null}
        </text>
      ))}
    </g>
  );
}
