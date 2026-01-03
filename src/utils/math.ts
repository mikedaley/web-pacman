import { Vec2, Direction } from './types';

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVec2(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function lengthVec2(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function distanceVec2(a: Vec2, b: Vec2): number {
  return lengthVec2(subVec2(a, b));
}

export function normalizeVec2(v: Vec2): Vec2 {
  const len = lengthVec2(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const directionVectors: Record<Direction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none: { x: 0, y: 0 },
};

export const oppositeDirection: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  none: 'none',
};

export function tileToPixel(tileX: number, tileY: number, tileSize: number): Vec2 {
  return {
    x: tileX * tileSize + tileSize / 2,
    y: tileY * tileSize + tileSize / 2,
  };
}

export function pixelToTile(x: number, y: number, tileSize: number): Vec2 {
  return {
    x: Math.floor(x / tileSize),
    y: Math.floor(y / tileSize),
  };
}
