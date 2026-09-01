import type { SchemaObject } from "@/lib/types";

export const BOX_WIDTH = 220;
export const HEADER_HEIGHT = 32;
export const ROW_HEIGHT = 22;
export const BOX_PADDING_BOTTOM = 8;

export function boxHeight(object: SchemaObject): number {
  return HEADER_HEIGHT + object.fields.length * ROW_HEIGHT + BOX_PADDING_BOTTOM;
}

/**
 * Point where a line from `center` toward `dir` exits the axis-aligned box
 * of half-width/half-height centered at `center`. Used to clip edge lines to
 * the box border instead of drawing them into the field-list interior.
 */
export function clipToBoxBorder(
  center: { x: number; y: number },
  halfWidth: number,
  halfHeight: number,
  dir: { x: number; y: number },
): { x: number; y: number } {
  if (dir.x === 0 && dir.y === 0) return center;
  const scale = 1 / Math.max(Math.abs(dir.x) / halfWidth, Math.abs(dir.y) / halfHeight);
  return { x: center.x + dir.x * scale, y: center.y + dir.y * scale };
}
