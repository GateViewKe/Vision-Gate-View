// lib/pathfinding.ts
// A* on a discrete grid.  Interior walls (lib/walls.ts) mark cells non-walkable
// so the path automatically threads through doorway gaps.

import { isPointInWall } from './walls'

export interface Point { x: number; y: number }

interface Node extends Point {
  g: number; h: number; f: number; parent: Node | null
}

const GRID_CELL     = 9
const CANVAS_ORIGIN = { x: 60, y: 60 }
const CANVAS_BOUNDS = { w: 680, h: 460 }

// Increase limit — interior walls force longer detours
const MAX_ITER = 8000

export function toGrid(px: number, py: number) {
  return {
    gx: Math.round((px - CANVAS_ORIGIN.x) / GRID_CELL),
    gy: Math.round((py - CANVAS_ORIGIN.y) / GRID_CELL),
  }
}
export function fromGrid(gx: number, gy: number): Point {
  return {
    x: CANVAS_ORIGIN.x + gx * GRID_CELL,
    y: CANVAS_ORIGIN.y + gy * GRID_CELL,
  }
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

// floor defaults to 1 (Departures) when called from the navigate API
let _currentFloor = 1
export function setPathfindingFloor(floor: number) { _currentFloor = floor }

function isWalkable(px: number, py: number): boolean {
  // Must be inside the terminal footprint
  if (
    px < CANVAS_ORIGIN.x + GRID_CELL ||
    px > CANVAS_ORIGIN.x + CANVAS_BOUNDS.w - GRID_CELL ||
    py < CANVAS_ORIGIN.y + GRID_CELL ||
    py > CANVAS_ORIGIN.y + CANVAS_BOUNDS.h - GRID_CELL
  ) return false

  // Must not be inside a wall rect
  return !isPointInWall(px, py, _currentFloor)
}

// Min-heap priority queue — O(log n) vs the original O(n) Array.sort
class MinHeap {
  private data: Node[] = []
  push(n: Node) {
    this.data.push(n)
    this._bubbleUp(this.data.length - 1)
  }
  pop(): Node | undefined {
    const top = this.data[0]
    const last = this.data.pop()!
    if (this.data.length > 0) { this.data[0] = last; this._sinkDown(0) }
    return top
  }
  get size() { return this.data.length }
  private _bubbleUp(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.data[p].f <= this.data[i].f) break
      ;[this.data[p], this.data[i]] = [this.data[i], this.data[p]]
      i = p
    }
  }
  private _sinkDown(i: number) {
    const n = this.data.length
    while (true) {
      let best = i, l = 2 * i + 1, r = l + 1
      if (l < n && this.data[l].f < this.data[best].f) best = l
      if (r < n && this.data[r].f < this.data[best].f) best = r
      if (best === i) break
      ;[this.data[best], this.data[i]] = [this.data[i], this.data[best]]
      i = best
    }
  }
}

export function astar(start: Point, end: Point, floor = _currentFloor): Point[] | null {
  _currentFloor = floor

  const gs = toGrid(start.x, start.y)
  const ge = toGrid(end.x, end.y)

  // Snap start/end to nearest walkable cell if they land inside a wall
  const snappedStart = snapToWalkable(gs.gx, gs.gy)
  const snappedEnd   = snapToWalkable(ge.gx, ge.gy)
  if (!snappedStart || !snappedEnd) return null

  const sn: Node = { x: snappedStart.gx, y: snappedStart.gy, g: 0, h: 0, f: 0, parent: null }
  sn.h = heuristic(sn.x, sn.y, snappedEnd.gx, snappedEnd.gy)
  sn.f = sn.h

  const heap    = new MinHeap()
  const closed  = new Set<string>()
  const bestG   = new Map<string, number>()

  heap.push(sn)
  bestG.set(`${sn.x},${sn.y}`, 0)

  const DIRS = [
    { dx: 1,  dy: 0,  cost: 1     }, { dx: -1, dy: 0,  cost: 1     },
    { dx: 0,  dy: 1,  cost: 1     }, { dx: 0,  dy: -1, cost: 1     },
    { dx: 1,  dy: 1,  cost: 1.414 }, { dx: -1, dy: 1,  cost: 1.414 },
    { dx: 1,  dy: -1, cost: 1.414 }, { dx: -1, dy: -1, cost: 1.414 },
  ]

  let iter = 0
  while (heap.size > 0 && iter++ < MAX_ITER) {
    const cur = heap.pop()!

    if (cur.x === snappedEnd.gx && cur.y === snappedEnd.gy) {
      return smoothPath(reconstructPath(cur))
    }

    const ck = `${cur.x},${cur.y}`
    if (closed.has(ck)) continue
    closed.add(ck)

    for (const d of DIRS) {
      const nx = cur.x + d.dx
      const ny = cur.y + d.dy
      const key = `${nx},${ny}`
      if (closed.has(key)) continue

      const { x: px, y: py } = fromGrid(nx, ny)
      if (!isWalkable(px, py)) continue

      // For diagonals, both axis-aligned neighbours must be walkable (prevents corner-cutting)
      if (d.dx !== 0 && d.dy !== 0) {
        const { x: ax, y: ay } = fromGrid(cur.x + d.dx, cur.y)
        const { x: bx, y: by } = fromGrid(cur.x,        cur.y + d.dy)
        if (!isWalkable(ax, ay) || !isWalkable(bx, by)) continue
      }

      const g = cur.g + d.cost
      if ((bestG.get(key) ?? Infinity) <= g) continue

      bestG.set(key, g)
      const h = heuristic(nx, ny, snappedEnd.gx, snappedEnd.gy)
      heap.push({ x: nx, y: ny, g, h, f: g + h, parent: cur })
    }
  }

  return null   // no path found
}

function reconstructPath(node: Node): Point[] {
  const path: Point[] = []
  let n: Node | null = node
  while (n) { path.unshift(fromGrid(n.x, n.y)); n = n.parent }
  return path
}

// Spiral search outward from (gx, gy) to find nearest walkable cell
function snapToWalkable(gx: number, gy: number, radius = 6): { gx: number; gy: number } | null {
  for (let r = 0; r <= radius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
        const { x, y } = fromGrid(gx + dx, gy + dy)
        if (isWalkable(x, y)) return { gx: gx + dx, gy: gy + dy }
      }
    }
  }
  return null
}

// Remove collinear waypoints
function smoothPath(path: Point[]): Point[] {
  if (path.length <= 2) return path
  const out: Point[] = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const p = out[out.length - 1], c = path[i], n = path[i + 1]
    const cross = (c.x - p.x) * (n.y - p.y) - (c.y - p.y) * (n.x - p.x)
    if (Math.abs(cross) > 0.01) out.push(c)
  }
  out.push(path[path.length - 1])
  return out
}

// Walking-time estimate (1.4 m/s, 1 canvas unit ≈ 0.05 m)
export function estimateWalkTime(path: Point[]): number {
  let dist = 0
  for (let i = 1; i < path.length; i++)
    dist += Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y)
  return Math.round((dist * 0.05) / 1.4)
}