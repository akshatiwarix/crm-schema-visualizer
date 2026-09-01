"use client";

import { useMemo } from "react";
import type { CrmSchema } from "@/lib/types";
import { computeLayout } from "@/lib/layout";
import { ObjectBox } from "./ObjectBox";
import { EdgeLine } from "./EdgeLine";
import { BOX_WIDTH, boxHeight } from "./box-geometry";

type SchemaCanvasProps = {
  schema: CrmSchema;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const VIEWBOX_PADDING = 80;

export function SchemaCanvas({ schema }: SchemaCanvasProps) {
  const positions = useMemo(() => computeLayout(schema, CANVAS_WIDTH, CANVAS_HEIGHT), [schema]);

  const objectByName = useMemo(() => new Map(schema.objects.map((o) => [o.name, o])), [schema]);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const obj of schema.objects) {
      const pos = positions[obj.name];
      const h = boxHeight(obj);
      minX = Math.min(minX, pos.x - BOX_WIDTH / 2);
      maxX = Math.max(maxX, pos.x + BOX_WIDTH / 2);
      minY = Math.min(minY, pos.y - h / 2);
      maxY = Math.max(maxY, pos.y + h / 2);
    }
    return {
      x: minX - VIEWBOX_PADDING,
      y: minY - VIEWBOX_PADDING,
      width: maxX - minX + VIEWBOX_PADDING * 2,
      height: maxY - minY + VIEWBOX_PADDING * 2,
    };
  }, [schema, positions]);

  return (
    <svg
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      className="h-full w-full"
    >
      <defs>
        <marker id="edge-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-400 dark:fill-slate-500" />
        </marker>
      </defs>
      {schema.relationships.map((rel, i) => {
        const fromObj = objectByName.get(rel.from);
        const toObj = objectByName.get(rel.to);
        if (!fromObj || !toObj) return null;
        return (
          <EdgeLine
            key={`${rel.from}-${rel.to}-${i}`}
            relationship={rel}
            from={{ object: fromObj, ...positions[rel.from] }}
            to={{ object: toObj, ...positions[rel.to] }}
          />
        );
      })}
      {schema.objects.map((obj) => (
        <ObjectBox key={obj.name} object={obj} x={positions[obj.name].x} y={positions[obj.name].y} />
      ))}
    </svg>
  );
}
