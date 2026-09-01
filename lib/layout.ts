import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum } from "d3-force";
import type { CrmSchema } from "@/lib/types";

export type LayoutPositions = Record<string, { x: number; y: number }>;

type LayoutNode = SimulationNodeDatum & { id: string };

const TICKS = 300;

/**
 * Deterministic node-position layout: d3-force runs synchronously to
 * convergence (no animated ticker) so this is a pure function of the schema,
 * safe to unit test and safe to call on every preset/custom-schema switch.
 */
export function computeLayout(schema: CrmSchema, width = 900, height = 600): LayoutPositions {
  const nodes: LayoutNode[] = schema.objects.map((obj, i) => {
    // Deterministic starting positions (not random) so re-running on the
    // same schema converges to the same layout every time.
    const angle = (i / schema.objects.length) * 2 * Math.PI;
    return {
      id: obj.name,
      x: width / 2 + Math.cos(angle) * 200,
      y: height / 2 + Math.sin(angle) * 200,
    };
  });

  const links = schema.relationships
    .filter((rel) => rel.from !== rel.to) // self-referencing links don't help layout spacing
    .map((rel) => ({ source: rel.from, target: rel.to }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<LayoutNode, { source: string; target: string }>(links)
        .id((d) => d.id)
        .distance(220),
    )
    .force("charge", forceManyBody().strength(-600))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(140))
    .stop();

  for (let i = 0; i < TICKS; i++) simulation.tick();

  const positions: LayoutPositions = {};
  for (const node of nodes) {
    positions[node.id] = {
      x: Number.isFinite(node.x) ? (node.x as number) : width / 2,
      y: Number.isFinite(node.y) ? (node.y as number) : height / 2,
    };
  }
  return positions;
}
