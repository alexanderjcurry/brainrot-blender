import * as THREE from 'three';

// Camera framing that adapts to any screen shape: get as close as possible
// while every key point stays on screen, then slide the picture so it sits
// in the middle (a lens shift, so the perspective doesn't change).

const v = new THREE.Vector3();

function measure(camera: THREE.Camera, points: THREE.Vector3[], limit: number) {
  camera.updateMatrixWorld();
  let ok = true;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    v.copy(p).project(camera);
    // |z| > 1 means the point is behind the camera or past the far plane.
    if (Math.abs(v.x) > limit || Math.abs(v.y) > limit || Math.abs(v.z) > 1) ok = false;
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  return { ok, minY, maxY };
}

export interface FitOptions {
  /** Degrees above the horizon to look down from. */
  elevation: number;
  /** Candidate points to aim at; the one that allows the closest camera wins. */
  aims: THREE.Vector3[];
  /** How far towards the screen edge points may go (1 = the very edge). */
  limit?: number;
}

export function fitCamera(camera: THREE.PerspectiveCamera, width: number, height: number, points: THREE.Vector3[], { elevation, aims, limit = 0.94 }: FitOptions) {
  if (width <= 0 || height <= 0) return;
  const e = (elevation * Math.PI) / 180;
  const dir = new THREE.Vector3(0, Math.sin(e), Math.cos(e));
  const place = (aim: THREE.Vector3, d: number) => {
    camera.position.copy(aim).addScaledVector(dir, d);
    camera.lookAt(aim);
  };

  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  let best = { aim: aims[0], d: Infinity };
  for (const aim of aims) {
    let lo = 0.2;
    let hi = 80;
    place(aim, hi);
    if (!measure(camera, points, limit).ok) continue;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      place(aim, mid);
      if (measure(camera, points, limit).ok) hi = mid;
      else lo = mid;
    }
    if (hi < best.d - 1e-3) best = { aim, d: hi };
  }
  if (!Number.isFinite(best.d)) best.d = 20;
  place(best.aim, best.d);

  // Centre the picture vertically.
  const m = measure(camera, points, limit);
  const shift = (m.maxY + m.minY) / 2;
  camera.setViewOffset(width, height, 0, (-shift * height) / 2, width, height);
}
