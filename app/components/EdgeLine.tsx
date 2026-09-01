import type { SchemaObject, SchemaRelationship } from "@/lib/types";
import { BOX_WIDTH, clipToBoxBorder, boxHeight } from "./box-geometry";

type NodeRef = { object: SchemaObject; x: number; y: number };

type EdgeLineProps = {
  relationship: SchemaRelationship;
  from: NodeRef;
  to: NodeRef;
};

const KIND_LABEL: Record<SchemaRelationship["kind"], string> = {
  lookup: "lookup",
  "master-detail": "master-detail",
  hierarchy: "hierarchy",
  junction: "many-to-many",
};

export function EdgeLine({ relationship, from, to }: EdgeLineProps) {
  const isSelfReferencing = from.object.name === to.object.name;

  if (isSelfReferencing) {
    const halfHeight = boxHeight(from.object) / 2;
    const right = from.x + BOX_WIDTH / 2;
    const top = from.y - halfHeight + 16;
    const bottom = from.y + halfHeight - 8;
    const loopX = right + 46;
    const path = `M ${right} ${top} C ${loopX} ${top}, ${loopX} ${bottom}, ${right} ${bottom}`;
    return (
      <g>
        <path d={path} fill="none" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1.5} markerEnd="url(#edge-arrow)" />
        <text x={loopX + 4} y={from.y} className="fill-slate-500 text-[10px] dark:fill-slate-400">
          {KIND_LABEL[relationship.kind]}
        </text>
      </g>
    );
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / dist, y: dy / dist };

  const start = clipToBoxBorder(from, BOX_WIDTH / 2, boxHeight(from.object) / 2, dir);
  const end = clipToBoxBorder(to, BOX_WIDTH / 2, boxHeight(to.object) / 2, { x: -dir.x, y: -dir.y });
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth={1.5}
        markerEnd="url(#edge-arrow)"
      />
      <g transform={`translate(${mid.x}, ${mid.y})`}>
        <rect x={-38} y={-9} width={76} height={16} rx={4} className="fill-slate-100 dark:fill-slate-800" />
        <text textAnchor="middle" y={3} className="fill-slate-600 text-[9px] dark:fill-slate-300">
          {KIND_LABEL[relationship.kind]}
        </text>
      </g>
    </g>
  );
}
