// lib/pathfinding.ts
// A* pathfinding on a discrete grid mapped from canvas coordinates.

export interface Point { x: number; y: number }

interface Node extends Point {
  g: number
  h: number
  f: number
  parent: Node | null
}

const GRID_CELL = 9          // pixels per grid cell
const CANVAS_ORIGIN = { x: 60, y: 60 }
const CANVAS_BOUNDS = { w: 680, h: 460 }

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

function heuristic(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function isWalkable(px: number, py: number): boolean {
  return (
    px >= CANVAS_ORIGIN.x + 5 &&
    px <= CANVAS_ORIGIN.x + CANVAS_BOUNDS.w - 5 &&
    py >= CANVAS_ORIGIN.y + 5 &&
    py <= CANVAS_ORIGIN.y + CANVAS_BOUNDS.h - 5
  )
}

export function astar(start: Point, end: Point): Point[] | null {
  const gs = toGrid(start.x, start.y)
  const ge = toGrid(end.x, end.y)

  const startNode: Node = { x: gs.gx, y: gs.gy, g: 0, h: 0, f: 0, parent: null }
  startNode.h = heuristic(startNode, { x: ge.gx, y: ge.gy })
  startNode.f = startNode.h

  const open: Node[] = [startNode]
  const closed = new Set<string>()
  const nodeMap = new Map<string, Node>()
  nodeMap.set(`${gs.gx},${gs.gy}`, startNode)

  const DIRS = [
    { dx: 1, dy: 0, cost: 1 }, { dx: -1, dy: 0, cost: 1 },
    { dx: 0, dy: 1, cost: 1 }, { dx: 0, dy: -1, cost: 1 },
    { dx: 1, dy: 1, cost: 1.414 }, { dx: -1, dy: 1, cost: 1.414 },
    { dx: 1, dy: -1, cost: 1.414 }, { dx: -1, dy: -1, cost: 1.414 },
  ]

  let iterations = 0
  while (open.length > 0 && iterations++ < 3000) {
    open.sort((a, b) => a.f - b.f)
    const cur = open.shift()!

    if (cur.x === ge.gx && cur.y === ge.gy) {
      const path: Point[] = []
      let node: Node | null = cur
      while (node) {
        path.unshift(fromGrid(node.x, node.y))
        node = node.parent
      }
      return smoothPath(path)
    }

    closed.add(`${cur.x},${cur.y}`)

    for (const d of DIRS) {
      const nx = cur.x + d.dx
      const ny = cur.y + d.dy
      const key = `${nx},${ny}`
      if (closed.has(key)) continue

      const { x: px, y: py } = fromGrid(nx, ny)
      if (!isWalkable(px, py)) continue

      const g = cur.g + d.cost
      const existing = nodeMap.get(key)
      if (existing && g >= existing.g) continue

      const h = heuristic({ x: nx, y: ny }, { x: ge.gx, y: ge.gy })
      const node: Node = { x: nx, y: ny, g, h, f: g + h, parent: cur }
      nodeMap.set(key, node)
      open.push(node)
    }
  }

  return null
}

// Remove collinear waypoints for cleaner routes
function smoothPath(path: Point[]): Point[] {
  if (path.length <= 2) return path
  const result: Point[] = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1]
    const cur = path[i]
    const next = path[i + 1]
    const crossProduct =
      (cur.x - prev.x) * (next.y - prev.y) - (cur.y - prev.y) * (next.x - prev.x)
    if (Math.abs(crossProduct) > 0.01) result.push(cur)
  }
  result.push(path[path.length - 1])
  return result
}

// Estimate walking time in seconds (avg 1.4 m/s, 1 canvas unit ≈ 0.05m)
export function estimateWalkTime(path: Point[]): number {
  let dist = 0
  for (let i = 1; i < path.length; i++) {
    dist += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
  }
  const meters = dist * 0.05
  return Math.round(meters / 1.4)
}
