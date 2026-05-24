// lib/walls.ts
// Single source of truth for all wall geometry.
// Both pathfinding (isWalkable) and AirportMap3D read from here.
// All coordinates are in canvas space (same system as POI x/y).
//
// Terminal footprint: x 60→740, y 60→520  (680 × 460 px)
// Interior walls create 3 corridor zones with doorway gaps.

export interface WallRect {
  x: number   // canvas xmin
  y: number   // canvas ymin
  w: number   // canvas width  (horizontal extent)
  h: number   // canvas height (vertical extent)
  kind: 'exterior' | 'interior'
}

// ── Exterior perimeter (rendered as tall solid walls) ─────────────────────────
// Derived from the terminal bounding box: (60,60)–(740,520)
const T = 12   // wall thickness in canvas px
export const EXTERIOR_WALLS: WallRect[] = [
  { x: 60,   y: 60,       w: 680, h: T,   kind: 'exterior' },  // North face
  { x: 60,   y: 520 - T,  w: 680, h: T,   kind: 'exterior' },  // South face
  { x: 60,   y: 60,       w: T,   h: 460, kind: 'exterior' },  // West face
  { x: 740 - T, y: 60,   w: T,   h: 460, kind: 'exterior' },  // East face
]

// ── Interior walls — Floor 1 (Departures) ─────────────────────────────────────
//
// Layout diagram (canvas space):
//
//  y=60  ┌────────────────────────────────────────────────────────┐
//        │  GATE ROW NORTH  (B10 B11 B12 B13 B14 B15 B16)        │
//  y=155 ├────────╥────────────────╥────────────────╥────────────┤  ← NORTH WALL
//        │        ║  upper corridor (open to gates)  ║            │
//  y=220 │WEST    ╠════════════════╬════════════════╣  EAST      │
//        │ZONE    ║  CENTRAL       ║                ║  ZONE      │
//        │(Lounge ║  CORRIDOR      ║                ║  (Shops/   │
//        │ Pride  ║  x 330→470     ║                ║   Dining)  │
//  y=355 │ Simba) ╠════════════════╬════════════════╣            │
//        │        ║  lower corridor (open to gates)  ║            │
//  y=425 ├────────╨────────────────╨────────────────╨────────────┤  ← SOUTH WALL
//        │  GATE ROW SOUTH  (B19 B20 B21 B22 B23)                │
//  y=520 └────────────────────────────────────────────────────────┘
//              x=330                             x=470
//        (west zone east wall)          (east zone west wall)
//
// Doorway gaps (≈55px wide each, walkable):
//   North/South walls: x=215–270, x=370–425, x=530–585
//   West/East zone walls: y=220–278, y=355–415

const D = 12   // interior wall thickness
export const INTERIOR_WALLS_FLOOR1: WallRect[] = [

  // ── North gate-row separator  (horizontal, at y ≈ 155) ───────────────────
  //    Three segments with door gaps at x=215-270, x=370-425, x=530-585
  { x: 140, y: 149, w:  75, h: D, kind: 'interior' },   // seg A  (x 140→215)
  { x: 270, y: 149, w: 100, h: D, kind: 'interior' },   // seg B  (x 270→370)
  { x: 425, y: 149, w: 105, h: D, kind: 'interior' },   // seg C  (x 425→530)
  { x: 585, y: 149, w:  75, h: D, kind: 'interior' },   // seg D  (x 585→660)

  // ── South gate-row separator  (horizontal, at y ≈ 425) ───────────────────
  { x: 140, y: 421, w:  75, h: D, kind: 'interior' },
  { x: 270, y: 421, w: 100, h: D, kind: 'interior' },
  { x: 425, y: 421, w: 105, h: D, kind: 'interior' },
  { x: 585, y: 421, w:  75, h: D, kind: 'interior' },

  // ── West zone east wall  (vertical, at x ≈ 330) ──────────────────────────
  //    Two segments with door gaps at y=220-278, y=355-415
  { x: 324, y: 161, w: D, h:  59, kind: 'interior' },   // seg A  (y 161→220)
  { x: 324, y: 278, w: D, h:  77, kind: 'interior' },   // seg B  (y 278→355)
  { x: 324, y: 415, w: D, h:  10, kind: 'interior' },   // seg C  (y 415→425, tiny closer)

  // ── East zone west wall  (vertical, at x ≈ 470) ──────────────────────────
  { x: 458, y: 161, w: D, h:  59, kind: 'interior' },
  { x: 458, y: 278, w: D, h:  77, kind: 'interior' },
  { x: 458, y: 415, w: D, h:  10, kind: 'interior' },
]

// Convenience: all wall rects for a given floor
export function wallsForFloor(floor: number): WallRect[] {
  const interior = floor === 1 ? INTERIOR_WALLS_FLOOR1 : []
  return [...EXTERIOR_WALLS, ...interior]
}

// Fast point-in-wall test used by pathfinding
export function isPointInWall(px: number, py: number, floor: number): boolean {
  for (const w of wallsForFloor(floor)) {
    if (px >= w.x && px <= w.x + w.w && py >= w.y && py <= w.y + w.h) return true
  }
  return false
}