import type { Point } from './types';

export function pxDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export function mmBetweenPoints(a: Point3, b: Point3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * 1000;
}
