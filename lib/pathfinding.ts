export interface Point { x: number; y: number }

interface Node extends Point { g: number; h: number; f: number; parent: Node | null }

const GRID_CELL = 9
const ORIGIN = { x: 60, y: 60 }
const BOUNDS = { w: 680, h: 460 }

export const toGrid = (px: number, py: number) => ({
  gx: Math.round((px - ORIGIN.x) / GRID_CELL),
  gy: Math.round((py - ORIGIN.y) / GRID_CELL),
})
export const fromGrid = (gx: number, gy: number): Point => ({
  x: ORIGIN.x + gx * GRID_CELL,
  y: ORIGIN.y + gy * GRID_CELL,
})

const heuristic = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

const isWalkable = (px: number, py: number) =>
  px >= ORIGIN.x + 5 && px <= ORIGIN.x + BOUNDS.w - 5 &&
  py >= ORIGIN.y + 5 && py <= ORIGIN.y + BOUNDS.h - 5

export function astar(start: Point, end: Point): Point[] | null {
  const gs = toGrid(start.x, start.y)
  const ge = toGrid(end.x, end.y)
  const startNode: Node = { x: gs.gx, y: gs.gy, g: 0, h: heuristic(gs, ge), f: 0, parent: null }
  startNode.f = startNode.h
  const open: Node[] = [startNode]
  const closed = new Set<string>()
  const nodeMap = new Map<string, Node>([[`${gs.gx},${gs.gy}`, startNode]])
  const DIRS = [
    { dx: 1, dy: 0, c: 1 }, { dx: -1, dy: 0, c: 1 }, { dx: 0, dy: 1, c: 1 }, { dx: 0, dy: -1, c: 1 },
    { dx: 1, dy: 1, c: 1.414 }, { dx: -1, dy: 1, c: 1.414 }, { dx: 1, dy: -1, c: 1.414 }, { dx: -1, dy: -1, c: 1.414 },
  ]
  let iters = 0
  while (open.length && iters++ < 3000) {
    open.sort((a, b) => a.f - b.f)
    const cur = open.shift()!
    if (cur.x === ge.gx && cur.y === ge.gy) {
      const path: Point[] = []
      let n: Node | null = cur
      while (n) { path.unshift(fromGrid(n.x, n.y)); n = n.parent }
      return smoothPath(path)
    }
    closed.add(`${cur.x},${cur.y}`)
    for (const d of DIRS) {
      const nx = cur.x + d.dx, ny = cur.y + d.dy
      const key = `${nx},${ny}`
      if (closed.has(key)) continue
      const { x: px, y: py } = fromGrid(nx, ny)
      if (!isWalkable(px, py)) continue
      const g = cur.g + d.c
      const existing = nodeMap.get(key)
      if (existing && g >= existing.g) continue
      const h = heuristic({ x: nx, y: ny }, ge)
      const node: Node = { x: nx, y: ny, g, h, f: g + h, parent: cur }
      nodeMap.set(key, node)
      open.push(node)
    }
  }
  return null
}

function smoothPath(path: Point[]): Point[] {
  if (path.length <= 2) return path
  const result: Point[] = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1], cur = path[i], next = path[i + 1]
    const cross = (cur.x - prev.x) * (next.y - prev.y) - (cur.y - prev.y) * (next.x - prev.x)
    if (Math.abs(cross) > 0.01) result.push(cur)
  }
  result.push(path[path.length - 1])
  return result
}

export function estimateWalkTime(path: Point[]): number {
  let dist = 0
  for (let i = 1; i < path.length; i++) dist += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
  return Math.round((dist * 0.05) / 1.4)
}
