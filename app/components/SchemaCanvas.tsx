"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmSchema } from "@/lib/types";
import { computeLayout, type LayoutPositions } from "@/lib/layout";
import { ObjectBox } from "./ObjectBox";
import { EdgeLine } from "./EdgeLine";
import { BOX_WIDTH, boxHeight } from "./box-geometry";

type SchemaCanvasProps = {
  schema: CrmSchema;
  /** Object names to highlight (e.g. from a search box); dims everything else. */
  highlightedNames?: string[];
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const VIEWBOX_PADDING = 80;
const MIN_ZOOM_SCALE = 0.35;
const MAX_ZOOM_SCALE = 3;
const DRAG_MOVE_THRESHOLD = 3;

type ViewBox = { x: number; y: number; w: number; h: number };

type DragState =
  | { type: "node"; name: string; startClientX: number; startClientY: number; startPos: { x: number; y: number }; scaleX: number; scaleY: number; moved: boolean }
  | { type: "pan"; startClientX: number; startClientY: number; startViewBox: ViewBox; scaleX: number; scaleY: number; moved: boolean };

function computeBounds(schema: CrmSchema, positions: LayoutPositions): ViewBox {
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
    w: maxX - minX + VIEWBOX_PADDING * 2,
    h: maxY - minY + VIEWBOX_PADDING * 2,
  };
}

/** One hop of relationship neighbors from `seeds`, plus the touched edge indices. */
function expandHighlight(schema: CrmSchema, seeds: Set<string>) {
  const nodes = new Set(seeds);
  const edges = new Set<number>();
  schema.relationships.forEach((rel, i) => {
    if (seeds.has(rel.from) || seeds.has(rel.to)) {
      nodes.add(rel.from);
      nodes.add(rel.to);
      edges.add(i);
    }
  });
  return { nodes, edges };
}

export function SchemaCanvas({ schema, highlightedNames }: SchemaCanvasProps) {
  // Keying by schema name remounts this subtree on preset switch/custom load,
  // which resets drag overrides, selection, and the camera for free — no
  // effect-based reset needed. Two different custom-JSON loads that happen to
  // share the same `name` field won't reset each other; acceptable for MVP.
  return <SchemaCanvasInner key={schema.name} schema={schema} highlightedNames={highlightedNames} />;
}

function SchemaCanvasInner({ schema, highlightedNames }: SchemaCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const layoutPositions = useMemo(() => computeLayout(schema, CANVAS_WIDTH, CANVAS_HEIGHT), [schema]);
  const objectByName = useMemo(() => new Map(schema.objects.map((o) => [o.name, o])), [schema]);
  const initialBounds = useMemo(() => computeBounds(schema, layoutPositions), [schema, layoutPositions]);

  const [positionOverrides, setPositionOverrides] = useState<LayoutPositions>({});
  const [viewBox, setViewBox] = useState<ViewBox>(initialBounds);
  const [selected, setSelected] = useState<string | null>(null);

  const positions = useMemo(() => {
    const merged: LayoutPositions = {};
    for (const obj of schema.objects) {
      merged[obj.name] = positionOverrides[obj.name] ?? layoutPositions[obj.name];
    }
    return merged;
  }, [schema, layoutPositions, positionOverrides]);

  const seedNames = useMemo(() => {
    if (selected) return new Set([selected]);
    if (highlightedNames && highlightedNames.length > 0) return new Set(highlightedNames);
    return null;
  }, [selected, highlightedNames]);

  const highlight = useMemo(() => (seedNames ? expandHighlight(schema, seedNames) : null), [schema, seedNames]);

  // Pointer handling: box drag-to-reposition and background pan, both driven
  // by screen-pixel deltas converted to SVG user-space units so they work
  // correctly at any zoom level.
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const dxScreen = e.clientX - drag.startClientX;
      const dyScreen = e.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(dxScreen, dyScreen) > DRAG_MOVE_THRESHOLD) {
        drag.moved = true;
      }
      const dxSvg = dxScreen * drag.scaleX;
      const dySvg = dyScreen * drag.scaleY;

      if (drag.type === "node") {
        setPositionOverrides((prev) => ({
          ...prev,
          [drag.name]: { x: drag.startPos.x + dxSvg, y: drag.startPos.y + dySvg },
        }));
      } else {
        setViewBox({
          x: drag.startViewBox.x - dxSvg,
          y: drag.startViewBox.y - dySvg,
          w: drag.startViewBox.w,
          h: drag.startViewBox.h,
        });
      }
    }

    function handlePointerUp() {
      const drag = dragRef.current;
      if (!drag) return;
      if (!drag.moved) {
        if (drag.type === "node") {
          setSelected((prev) => (prev === drag.name ? null : drag.name));
        } else {
          setSelected(null);
        }
      }
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  // Wheel-to-zoom, attached natively so preventDefault isn't blocked by React's passive listener.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = svg!.getBoundingClientRect();
      setViewBox((prev) => {
        const factor = Math.exp(e.deltaY * 0.001);
        const newW = clamp(prev.w * factor, initialBounds.w / MAX_ZOOM_SCALE, initialBounds.w / MIN_ZOOM_SCALE);
        const scale = newW / prev.w;
        const newH = prev.h * scale;
        const cursorX = prev.x + ((e.clientX - rect.left) / rect.width) * prev.w;
        const cursorY = prev.y + ((e.clientY - rect.top) / rect.height) * prev.h;
        return {
          x: cursorX - ((e.clientX - rect.left) / rect.width) * newW,
          y: cursorY - ((e.clientY - rect.top) / rect.height) * newH,
          w: newW,
          h: newH,
        };
      });
    }
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [initialBounds]);

  function startNodeDrag(name: string) {
    return (e: React.PointerEvent<SVGGElement>) => {
      e.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      dragRef.current = {
        type: "node",
        name,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPos: positions[name],
        scaleX: viewBox.w / rect.width,
        scaleY: viewBox.h / rect.height,
        moved: false,
      };
    };
  }

  function startPan(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    dragRef.current = {
      type: "pan",
      startClientX: e.clientX,
      startClientY: e.clientY,
      startViewBox: viewBox,
      scaleX: viewBox.w / rect.width,
      scaleY: viewBox.h / rect.height,
      moved: false,
    };
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      className="h-full w-full touch-none select-none"
      onPointerDown={startPan}
    >
      <defs>
        <marker id="edge-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-400 dark:fill-slate-500" />
        </marker>
        <marker id="edge-arrow-highlighted" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-sky-500" />
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
            highlighted={highlight ? highlight.edges.has(i) : false}
            dimmed={highlight ? !highlight.edges.has(i) : false}
          />
        );
      })}
      {schema.objects.map((obj) => (
        <ObjectBox
          key={obj.name}
          object={obj}
          x={positions[obj.name].x}
          y={positions[obj.name].y}
          highlighted={highlight ? highlight.nodes.has(obj.name) : false}
          dimmed={highlight ? !highlight.nodes.has(obj.name) : false}
          onPointerDown={startNodeDrag(obj.name)}
        />
      ))}
    </svg>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
