import * as THREE from 'three'

import { BRAND } from '@shared/brand-tokens';
export { BRAND } from '@shared/brand-tokens';

const cCyan = new THREE.Color(BRAND.cyan)
const cBlue = new THREE.Color(BRAND.blue)
const cPurple = new THREE.Color(BRAND.purple)
const cMagenta = new THREE.Color(BRAND.magenta)
const cInkTop = new THREE.Color('#161e33')

/** Multi-stop gradient: 0 cyan → 0.38 blue → 0.72 purple → 1 magenta */
export function inkGradient(t: number, out: THREE.Color): THREE.Color {
  const x = THREE.MathUtils.clamp(t, 0, 1)
  if (x < 0.38) return out.copy(cCyan).lerp(cBlue, x / 0.38)
  if (x < 0.72) return out.copy(cBlue).lerp(cPurple, (x - 0.38) / 0.34)
  return out.copy(cPurple).lerp(cMagenta, (x - 0.72) / 0.28)
}

/** Paint per-vertex colors onto a geometry using a mapping function. */
function paintGradient(
  geo: THREE.BufferGeometry,
  fn: (x: number, y: number, z: number) => THREE.Color,
) {
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const tmp = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    tmp.copy(fn(pos.getX(i), pos.getY(i), pos.getZ(i)))
    colors[i * 3] = tmp.r
    colors[i * 3 + 1] = tmp.g
    colors[i * 3 + 2] = tmp.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.075,
  bevelSegments: 5,
  curveSegments: 16,
}

/**
 * The Virtual Ink "V" — a wide ribbon with rounded tips.
 * Outer half-width 1.55, height 3.0, stroke ~0.72.
 * Gradient flows cyan (top-left) → blue → purple → magenta (bottom point).
 */
export function buildVGeometry(): THREE.ExtrudeGeometry {
  const ow = 1.55
  const top = 1.5
  const bot = -1.35
  const iw = 0.83 // inner half-width at top
  const ib = -0.42 // inner bottom y
  const r = 0.09 // tip corner radius

  const s = new THREE.Shape()
  // outer left tip (top edge, rounded)
  s.moveTo(-ow + r, top)
  // down outer-left edge toward bottom vertex
  s.lineTo(-0.16, bot + 0.32)
  // rounded bottom point
  s.quadraticCurveTo(0, bot - 0.1, 0.16, bot + 0.32)
  // up outer-right edge
  s.lineTo(ow - r, top)
  s.quadraticCurveTo(ow, top, ow, top - r)
  // inner top-right
  s.lineTo(iw + r, top - r)
  s.quadraticCurveTo(iw, top - r, iw - 0.02, top - r - 0.16)
  // down inner-right edge to inner bottom vertex
  s.lineTo(0.11, ib + 0.26)
  s.quadraticCurveTo(0, ib, -0.11, ib + 0.26)
  // up inner-left edge
  s.lineTo(-iw + 0.02, top - r - 0.16)
  s.quadraticCurveTo(-iw, top - r, -iw - r, top - r)
  // across the left tip
  s.lineTo(-ow, top - r)
  s.quadraticCurveTo(-ow, top, -ow + r, top)

  const geo = new THREE.ExtrudeGeometry(s, EXTRUDE)
  geo.center()
  const col = new THREE.Color()
  paintGradient(geo, (x, y) => {
    const t = ((x + ow) / (2 * ow)) * 0.62 + ((top - y) / (top - bot)) * 0.38
    return inkGradient(t, col)
  })
  return geo
}

/**
 * The "I" — a dark polished column, cyan ink flooding up from its base.
 */
export function buildIGeometry(): THREE.ExtrudeGeometry {
  const w = 0.72
  const h = 2.9
  const rad = 0.2
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + rad, y)
  s.lineTo(x + w - rad, y)
  s.quadraticCurveTo(x + w, y, x + w, y + rad)
  s.lineTo(x + w, y + h - rad)
  s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
  s.lineTo(x + rad, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - rad)
  s.lineTo(x, y + rad)
  s.quadraticCurveTo(x, y, x + rad, y)

  const geo = new THREE.ExtrudeGeometry(s, EXTRUDE)
  geo.center()
  const col = new THREE.Color()
  paintGradient(geo, (_x, yy) => {
    const t = THREE.MathUtils.clamp((yy + h / 2) / h, 0, 1) // 0 bottom → 1 top
    if (t < 0.42) return col.copy(cCyan).lerp(cBlue, t / 0.42)
    return col.copy(cBlue).lerp(cInkTop, Math.min(1, (t - 0.42) / 0.4))
  })
  return geo
}

/**
 * The ink droplet that crowns the "I" — lathed teardrop,
 * magenta body fading to deep purple at the tip.
 */
export function buildDropletGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  const profile: Array<[number, number]> = [
    [0.001, 0],
    [0.16, 0.01],
    [0.27, 0.06],
    [0.335, 0.16],
    [0.345, 0.3],
    [0.31, 0.46],
    [0.24, 0.62],
    [0.155, 0.78],
    [0.075, 0.92],
    [0.02, 1.02],
    [0.001, 1.06],
  ]
  for (const [px, py] of profile) pts.push(new THREE.Vector2(px, py))
  const geo = new THREE.LatheGeometry(pts, 48)
  const col = new THREE.Color()
  paintGradient(geo, (_x, yy) => {
    const t = THREE.MathUtils.clamp(yy / 1.06, 0, 1)
    return col.copy(cMagenta).lerp(cPurple, t * 0.9)
  })
  return geo
}

/** Small pixel square (extruded rounded rect) used around the V's top-left. */
export function buildPixelGeometry(size: number): THREE.ExtrudeGeometry {
  const rad = size * 0.22
  const s = new THREE.Shape()
  const x = -size / 2
  const y = -size / 2
  s.moveTo(x + rad, y)
  s.lineTo(x + size - rad, y)
  s.quadraticCurveTo(x + size, y, x + size, y + rad)
  s.lineTo(x + size, y + size - rad)
  s.quadraticCurveTo(x + size, y + size, x + size - rad, y + size)
  s.lineTo(x + rad, y + size)
  s.quadraticCurveTo(x, y + size, x, y + size - rad)
  s.lineTo(x, y + rad)
  s.quadraticCurveTo(x, y, x + rad, y)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: size * 0.5,
    bevelEnabled: true,
    bevelThickness: size * 0.12,
    bevelSize: size * 0.1,
    bevelSegments: 3,
    curveSegments: 8,
  })
  geo.center()
  const col = new THREE.Color()
  paintGradient(geo, (px, py) => {
    const t = THREE.MathUtils.clamp((px + py) / (size * 2) + 0.5, 0, 1)
    return col.copy(cCyan).lerp(cBlue, t)
  })
  return geo
}

export interface PixelSpec {
  size: number
  home: [number, number, number]
  scatter: [number, number, number]
  delay: number
  spin: number
}

/** Pixel layout echoing the approved logo (top-left of the V). */
export const PIXELS: PixelSpec[] = [
  { size: 0.34, home: [-2.28, 1.62, 0], scatter: [-4.6, 3.6, 1.6], delay: 0.0, spin: 1.4 },
  { size: 0.22, home: [-1.82, 2.3, 0.1], scatter: [-3.4, 4.6, -1.2], delay: 0.12, spin: -1.1 },
  { size: 0.2, home: [-2.62, 2.42, -0.06], scatter: [-5.2, 4.4, 0.8], delay: 0.22, spin: 0.9 },
  { size: 0.17, home: [-2.06, 1.14, 0.08], scatter: [-4.1, 2.4, 1.9], delay: 0.3, spin: -1.6 },
  { size: 0.14, home: [-1.56, 1.86, -0.1], scatter: [-3.0, 3.8, -1.8], delay: 0.38, spin: 1.9 },
]

/** Composition offsets so the whole monogram is optically centered. */
export const LAYOUT = {
  v: [-0.78, -0.42, 0] as [number, number, number],
  i: [1.08, -0.42, 0] as [number, number, number],
  droplet: [1.08, 1.32, 0] as [number, number, number],
  groupLift: 0.55,
}

/** Sample a random point on the V ribbon's front face (for particle convergence). */
export function sampleVPoint(rand: () => number): [number, number, number] {
  const left = rand() < 0.5
  const u = rand()
  const ax = left ? -1.55 : 1.55
  const ay = 1.5
  // lerp from tip toward bottom vertex (0,-1.35)
  const bx = ax + (0 - ax) * u
  const by = ay + (-1.35 - ay) * u
  const jx = (rand() - 0.5) * 0.6
  const jy = (rand() - 0.5) * 0.5
  return [bx + jx + LAYOUT.v[0], by + jy + LAYOUT.v[1] + LAYOUT.groupLift, 0.35 + rand() * 0.15]
}

/* ---------- easing ---------- */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
export const easeOutBack = (t: number, s = 1.70158) => {
  const x = t - 1
  return 1 + (s + 1) * x * x * x + s * x * x
}
export const clamp01 = (t: number) => THREE.MathUtils.clamp(t, 0, 1)
