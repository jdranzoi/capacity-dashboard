/**
 * Deterministic force-directed layout (Fruchterman–Reingold variant).
 *
 * Pure and seeded by node id, so server and client render identical positions
 * (no hydration mismatch) without any external graph/physics dependency.
 */

export type LayoutNodeInput = {
  id: string
  weight: number
}

export type LayoutEdgeInput = {
  source: string
  target: string
  weight: number
}

export type LayoutPoint = { x: number; y: number }

function hashSeed(id: string): number {
  let hash = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

export function computeCollaborationLayout(
  nodes: LayoutNodeInput[],
  edges: LayoutEdgeInput[],
  width: number,
  height: number,
  iterations = 320
): Map<string, LayoutPoint> {
  const positions = new Map<string, LayoutPoint>()
  const n = nodes.length
  if (n === 0) return positions

  const centerX = width / 2
  const centerY = height / 2

  if (n === 1) {
    positions.set(nodes[0]!.id, { x: centerX, y: centerY })
    return positions
  }

  const radius = Math.min(width, height) * 0.32
  nodes.forEach((node, index) => {
    const seed = hashSeed(node.id)
    const angle = (index / n) * Math.PI * 2 + seed * 0.6
    const r = radius * (0.55 + seed * 0.45)
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
    })
  })

  const area = width * height
  const k = Math.sqrt(area / n) * 0.5
  const k2 = k * k
  let temperature = Math.min(width, height) * 0.18

  const disp = new Map<string, LayoutPoint>()

  for (let iter = 0; iter < iterations; iter += 1) {
    for (const node of nodes) disp.set(node.id, { x: 0, y: 0 })

    for (let i = 0; i < n; i += 1) {
      const a = nodes[i]!
      const pa = positions.get(a.id)!
      const da = disp.get(a.id)!
      for (let j = i + 1; j < n; j += 1) {
        const b = nodes[j]!
        const pb = positions.get(b.id)!
        let dx = pa.x - pb.x
        let dy = pa.y - pb.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.01) {
          dx = (hashSeed(a.id + b.id) - 0.5) * 0.1
          dy = (hashSeed(b.id + a.id) - 0.5) * 0.1
          dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        }
        const force = k2 / dist
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        da.x += fx
        da.y += fy
        const db = disp.get(b.id)!
        db.x -= fx
        db.y -= fy
      }
    }

    for (const edge of edges) {
      const pa = positions.get(edge.source)
      const pb = positions.get(edge.target)
      if (!pa || !pb) continue
      const dx = pa.x - pb.x
      const dy = pa.y - pb.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const strength = 1 + Math.log2(1 + edge.weight)
      const force = ((dist * dist) / k) * strength * 0.065
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      const da = disp.get(edge.source)!
      const db = disp.get(edge.target)!
      da.x -= fx
      da.y -= fy
      db.x += fx
      db.y += fy
    }

    for (const node of nodes) {
      const p = positions.get(node.id)!
      const d = disp.get(node.id)!
      d.x += (centerX - p.x) * 0.025
      d.y += (centerY - p.y) * 0.025

      const len = Math.sqrt(d.x * d.x + d.y * d.y) || 0.01
      const step = Math.min(len, temperature)
      p.x += (d.x / len) * step
      p.y += (d.y / len) * step
    }

    temperature *= 0.985
  }

  fitToBounds(positions, width, height, 28)
  return positions
}

export type CollaborationGraphViewBoxPadding = {
  x: number
  top: number
  bottom: number
}

/** Tight SVG viewBox around laid-out nodes (includes label clearance below each node). */
export function collaborationGraphViewBox(
  layout: Map<string, LayoutPoint>,
  nodeExtents: ReadonlyArray<{ id: string; radius: number; showLabel: boolean }>,
  padding: CollaborationGraphViewBoxPadding = { x: 28, top: 20, bottom: 24 },
  fallbackWidth = 880,
  fallbackHeight = 580
): string {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of nodeExtents) {
    const p = layout.get(node.id)
    if (!p) continue
    const labelClearance = node.showLabel ? 14 : 0
    minX = Math.min(minX, p.x - node.radius)
    maxX = Math.max(maxX, p.x + node.radius)
    minY = Math.min(minY, p.y - node.radius)
    maxY = Math.max(maxY, p.y + node.radius + labelClearance)
  }

  if (!Number.isFinite(minX)) {
    return `0 0 ${fallbackWidth} ${fallbackHeight}`
  }

  minX -= padding.x
  maxX += padding.x
  minY -= padding.top
  maxY += padding.bottom

  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)
  return `${minX} ${minY} ${width} ${height}`
}

function fitToBounds(
  positions: Map<string, LayoutPoint>,
  width: number,
  height: number,
  padding: number
): void {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of positions.values()) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }

  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY)
  const offsetX = (width - spanX * scale) / 2
  const offsetY = (height - spanY * scale) / 2

  for (const p of positions.values()) {
    p.x = (p.x - minX) * scale + offsetX
    p.y = (p.y - minY) * scale + offsetY
  }
}
