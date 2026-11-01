import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// A tiny "toy kit" for building models out of simple shapes.
// Every part gets a vertex colour, and a finished model is merged into ONE
// geometry, so each creature on the board costs a single draw call.

export type V3 = [number, number, number];

export interface PartOptions {
  p?: V3; // position
  r?: V3; // rotation (radians, XYZ)
  s?: V3 | number; // scale
}

const cache = new Map<string, THREE.BufferGeometry>();

function shared(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = cache.get(key);
  if (!g) {
    const made = make();
    // Some shapes come indexed and some not; merging needs them all the same.
    g = made.index ? made.toNonIndexed() : made;
    g.deleteAttribute('uv');
    cache.set(key, g);
  }
  return g;
}

export const shapes = {
  sphere: () => shared('sphere', () => new THREE.SphereGeometry(1, 22, 16)),
  cylinder: () => shared('cylinder', () => new THREE.CylinderGeometry(1, 1, 1, 18)),
  cone: () => shared('cone', () => new THREE.ConeGeometry(1, 1, 18)),
  box: () => shared('box', () => new THREE.BoxGeometry(1, 1, 1)),
  roundBox: (w: number, h: number, d: number, radius = 0.05) =>
    shared(`rbox:${w}:${h}:${d}:${radius}`, () => new RoundedBoxGeometry(w, h, d, 3, radius)),
  torus: (radius: number, tube: number, arc = Math.PI * 2) =>
    shared(`torus:${radius}:${tube}:${arc}`, () => new THREE.TorusGeometry(radius, tube, 12, 32, arc)),
  /** A slice of a dome, used for striped umbrella canopies. */
  domeSlice: (phiStart: number, phiLength: number) =>
    shared(`dome:${phiStart}:${phiLength}`, () => new THREE.SphereGeometry(1, 6, 10, phiStart, phiLength, 0, Math.PI / 2)),
  tube: (key: string, points: V3[], radius: number) =>
    shared(`tube:${key}:${radius}`, () => {
      const curve = new THREE.CatmullRomCurve3(points.map((v) => new THREE.Vector3(...v)));
      return new THREE.TubeGeometry(curve, 16, radius, 8, false);
    }),
  openCone: (radius: number, height: number) =>
    shared(`ocone:${radius}:${height}`, () => new THREE.CylinderGeometry(radius, radius * 0.18, height, 18, 1, true)),
};

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();

export class Kit {
  private parts: THREE.BufferGeometry[] = [];
  private offset: V3 = [0, 0, 0];
  private scaleAll = 1;

  /** Shift and scale every part added after this call (used to place a head on a body). */
  frame(offset: V3, scale = 1): this {
    this.offset = offset;
    this.scaleAll = scale;
    return this;
  }

  add(geometry: THREE.BufferGeometry, color: string, { p = [0, 0, 0], r = [0, 0, 0], s = 1 }: PartOptions = {}): this {
    const g = geometry.clone();
    const sc: V3 = typeof s === 'number' ? [s, s, s] : s;
    const k = this.scaleAll;
    tmpPos.set(this.offset[0] + p[0] * k, this.offset[1] + p[1] * k, this.offset[2] + p[2] * k);
    tmpQuat.setFromEuler(tmpEuler.set(r[0], r[1], r[2]));
    tmpScale.set(sc[0] * k, sc[1] * k, sc[2] * k);
    g.applyMatrix4(tmpMatrix.compose(tmpPos, tmpQuat, tmpScale));
    const c = new THREE.Color(color);
    const count = g.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.parts.push(g);
    return this;
  }

  ball(color: string, p: V3, s: V3 | number): this {
    return this.add(shapes.sphere(), color, { p, s });
  }

  /** Cartoon eye looking toward the camera (+Z). */
  eye(p: V3, size: number): this {
    this.ball('#FFFFFF', p, size);
    this.ball('#1B1530', [p[0], p[1], p[2] + size * 0.62], size * 0.58);
    this.ball('#FFFFFF', [p[0] + size * 0.22, p[1] + size * 0.24, p[2] + size * 1.05], size * 0.16);
    return this;
  }

  build(): THREE.BufferGeometry {
    const merged = mergeGeometries(this.parts, false);
    if (!merged) throw new Error('could not merge model');
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    for (const part of this.parts) part.dispose();
    this.parts = [];
    return merged;
  }
}

/** Darken or lighten a hex colour by a factor (0.8 = 20% darker). */
export function shade(hex: string, factor: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l * factor)));
  return `#${c.getHexString()}`;
}
