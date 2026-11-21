// The museum floor: parses a level's ASCII map into tiles and answers the
// questions gameplay needs — is a tile solid, does a wall block a sight line,
// is a point in shadow or lamplight, and can Wren walk from A to B.

import { TILE, MAP_COLS, MAP_ROWS } from './config.js';

export const SOLID_TILES = new Set(['#', 'C', 'P', 'S', 'T']);
export const COVER_TILES = new Set(['C', 'P', 'S', 'T']);

export function createWorld(level) {
  const tiles = level.map.map((row) => row.split(''));
  const loot = [];
  const lamps = [];
  let playerStart = null;
  let opal = null;
  let exit = null;
  const guardSpawns = [];

  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      const ch = tiles[row][col];
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      if (ch === '*') playerStart = { x: cx, y: cy, col, row };
      if (ch === 'O') opal = { x: cx, y: cy, col, row, taken: false };
      if (ch === 'X') exit = { x: cx, y: cy, col, row };
      if (ch === 'o') loot.push({ x: cx, y: cy, col, row, taken: false });
      if (ch === 'L') lamps.push({ x: cx, y: cy, col, row });
      if (ch === 'G') guardSpawns.push({ x: cx, y: cy, col, row });
    }
  }

  return { level, tiles, loot, lamps, playerStart, opal, exit, guardSpawns };
}

export function tileAt(world, col, row) {
  if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return '#';
  return world.tiles[row][col];
}

export function tileAtPixel(world, x, y) {
  return tileAt(world, Math.floor(x / TILE), Math.floor(y / TILE));
}

export function isSolidTile(world, col, row) {
  return SOLID_TILES.has(tileAt(world, col, row));
}

// A circle (Wren, a guard) collides with solid tiles. Returns the position
// pushed out of any wall it overlaps, axis by axis so sliding works.
export function resolveCircleCollision(world, x, y, radius) {
  let nx = x;
  let ny = y;
  const minCol = Math.floor((nx - radius) / TILE);
  const maxCol = Math.floor((nx + radius) / TILE);
  const minRow = Math.floor((ny - radius) / TILE);
  const maxRow = Math.floor((ny + radius) / TILE);
  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      if (!isSolidTile(world, col, row)) continue;
      const left = col * TILE;
      const right = left + TILE;
      const top = row * TILE;
      const bottom = top + TILE;
      const closestX = Math.max(left, Math.min(nx, right));
      const closestY = Math.max(top, Math.min(ny, bottom));
      const dx = nx - closestX;
      const dy = ny - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq >= radius * radius) continue;
      if (distSq === 0) {
        ny = top - radius;
        continue;
      }
      const dist = Math.sqrt(distSq);
      const push = radius - dist;
      nx += (dx / dist) * push;
      ny += (dy / dist) * push;
    }
  }
  return { x: nx, y: ny };
}

// True when the segment from (x1, y1) to (x2, y2) crosses no solid tile.
// Steps along the segment in small increments and checks the tile at each.
export function lineOfSight(world, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return true;
  const steps = Math.ceil(dist / 6);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (isSolidTile(world, Math.floor((x1 + dx * t) / TILE), Math.floor((y1 + dy * t) / TILE))) {
      return false;
    }
  }
  return true;
}

// Distance from (x, y) along a direction until a solid tile, capped at maxDist.
export function castRay(world, x, y, angle, maxDist) {
  const step = 5;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let cx = x;
  let cy = y;
  let travelled = 0;
  while (travelled < maxDist) {
    cx += dx;
    cy += dy;
    travelled += step;
    if (isSolidTile(world, Math.floor(cx / TILE), Math.floor(cy / TILE))) {
      return travelled;
    }
  }
  return maxDist;
}

// The guard's vision cone as a polygon: the guard's position plus the end of
// a fan of rays, so the cone hugs walls and cover instead of shining through.
export function castVisionCone(world, guard, rayCount = 26) {
  const points = [{ x: guard.x, y: guard.y }];
  const half = guard.halfAngle;
  for (let i = 0; i <= rayCount; i += 1) {
    const angle = guard.facing - half + (2 * half * i) / rayCount;
    const dist = castRay(world, guard.x, guard.y, angle, guard.range);
    points.push({ x: guard.x + Math.cos(angle) * dist, y: guard.y + Math.sin(angle) * dist });
  }
  return points;
}

export function isShadowTile(world, x, y) {
  return tileAtPixel(world, x, y) === ',';
}

export function isLampLit(world, x, y) {
  for (const lamp of world.lamps) {
    if (Math.hypot(x - lamp.x, y - lamp.y) <= 95) return true;
  }
  return false;
}

// Breadth-first walkability check used by the test harness: can a walker on
// floor tiles reach every objective from the start?
export function reachableFrom(world, startCol, startRow) {
  const seen = new Set([`${startCol},${startRow}`]);
  const queue = [[startCol, startRow]];
  while (queue.length > 0) {
    const [col, row] = queue.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc;
      const nr = row + dr;
      const key = `${nc},${nr}`;
      if (seen.has(key)) continue;
      if (isSolidTile(world, nc, nr)) continue;
      seen.add(key);
      queue.push([nc, nr]);
    }
  }
  return seen;
}
