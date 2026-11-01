import * as THREE from 'three';
import { ANIMALS, AnimalId, IngredientId, OBJECTS, ObjectId, isAnimal } from '../game/content';
import { CreatureId, parseCreatureId } from '../game/creatures';
import { Kit, V3, shade, shapes } from './kit';

// 3D models for every animal, object and creature, built from simple shapes.
// Units: one board tile is 1 x 1. Models stand on y = 0 and face the camera (+Z).

const HEAD_RADIUS = 0.2;

function head(k: Kit, id: AnimalId) {
  const a = ANIMALS[id];
  switch (id) {
    case 'pigeon':
      k.add(shapes.torus(0.13, 0.05), a.accent, { p: [0, -0.15, 0], r: [Math.PI / 2, 0, 0] });
      k.ball(a.color, [0, 0, 0], 0.19);
      k.add(shapes.cone(), '#F2C94C', { p: [0, -0.03, 0.22], r: [Math.PI / 2, 0, 0], s: [0.045, 0.11, 0.045] });
      k.ball('#F1F5F9', [0, 0.02, 0.18], [0.035, 0.022, 0.02]);
      k.eye([-0.075, 0.05, 0.15], 0.045);
      k.eye([0.075, 0.05, 0.15], 0.045);
      break;
    case 'capybara':
      k.ball(shade(a.color, 0.75), [-0.15, 0.15, -0.03], 0.05);
      k.ball(shade(a.color, 0.75), [0.15, 0.15, -0.03], 0.05);
      k.ball(a.color, [0, 0, 0], [0.21, 0.18, 0.21]);
      k.ball(a.accent, [0, -0.05, 0.15], [0.14, 0.1, 0.1]);
      k.ball('#1B1530', [-0.04, -0.03, 0.245], 0.018);
      k.ball('#1B1530', [0.04, -0.03, 0.245], 0.018);
      // Half-closed, totally unbothered eyes.
      k.add(shapes.box(), '#1B1530', { p: [-0.09, 0.06, 0.185], r: [0, 0, 0.12], s: [0.07, 0.014, 0.02] });
      k.add(shapes.box(), '#1B1530', { p: [0.09, 0.06, 0.185], r: [0, 0, -0.12], s: [0.07, 0.014, 0.02] });
      break;
    case 'hamster':
      k.ball(a.color, [-0.13, 0.16, 0], [0.07, 0.07, 0.035]);
      k.ball('#F9A8D4', [-0.13, 0.16, 0.02], [0.04, 0.04, 0.02]);
      k.ball(a.color, [0.13, 0.16, 0], [0.07, 0.07, 0.035]);
      k.ball('#F9A8D4', [0.13, 0.16, 0.02], [0.04, 0.04, 0.02]);
      k.ball(a.color, [0, 0, 0], 0.2);
      k.ball(a.accent, [-0.11, -0.06, 0.11], 0.1);
      k.ball(a.accent, [0.11, -0.06, 0.11], 0.1);
      k.ball('#F472B6', [0, -0.01, 0.2], 0.026);
      k.eye([-0.07, 0.05, 0.165], 0.04);
      k.eye([0.07, 0.05, 0.165], 0.04);
      break;
    case 'octopus':
      k.ball(a.color, [0, 0.04, 0], [0.21, 0.25, 0.21]);
      k.ball(a.accent, [-0.08, 0.2, 0.12], 0.035);
      k.ball(a.accent, [0.09, 0.22, 0.08], 0.028);
      k.ball(a.accent, [0.13, 0.12, 0.14], 0.022);
      k.eye([-0.08, 0, 0.16], 0.065);
      k.eye([0.08, 0, 0.16], 0.065);
      break;
    case 'snail':
      k.add(shapes.cylinder(), a.color, { p: [-0.07, 0.17, 0.05], r: [0, 0, 0.35], s: [0.022, 0.2, 0.022] });
      k.add(shapes.cylinder(), a.color, { p: [0.07, 0.17, 0.05], r: [0, 0, -0.35], s: [0.022, 0.2, 0.022] });
      k.ball(a.color, [0, 0, 0], [0.16, 0.15, 0.16]);
      k.eye([-0.11, 0.27, 0.06], 0.05);
      k.eye([0.11, 0.27, 0.06], 0.05);
      k.add(shapes.torus(0.05, 0.012, Math.PI), '#1B1530', { p: [0, -0.03, 0.15], r: [0, 0, Math.PI] });
      break;
    case 'raccoon':
      k.add(shapes.cone(), a.color, { p: [-0.13, 0.19, 0], r: [0, 0, 0.35], s: [0.07, 0.13, 0.05] });
      k.add(shapes.cone(), a.color, { p: [0.13, 0.19, 0], r: [0, 0, -0.35], s: [0.07, 0.13, 0.05] });
      k.ball(a.color, [0, 0, 0], 0.2);
      k.ball(a.accent, [0, 0.05, 0.13], [0.19, 0.075, 0.08]);
      k.ball('#F5F5F5', [0, -0.07, 0.15], [0.1, 0.07, 0.08]);
      k.ball('#1B1530', [0, -0.04, 0.235], 0.03);
      k.eye([-0.075, 0.055, 0.18], 0.035);
      k.eye([0.075, 0.055, 0.18], 0.035);
      break;
    case 'goat':
      k.add(shapes.tube('hornL', [[-0.06, 0.15, -0.02], [-0.12, 0.27, -0.08], [-0.22, 0.28, -0.12]], 0.025), a.accent);
      k.add(shapes.tube('hornR', [[0.06, 0.15, -0.02], [0.12, 0.27, -0.08], [0.22, 0.28, -0.12]], 0.025), a.accent);
      k.ball(a.color, [-0.19, 0.05, 0], [0.1, 0.035, 0.045]);
      k.ball(a.color, [0.19, 0.05, 0], [0.1, 0.035, 0.045]);
      k.ball(a.color, [0, 0, 0], [0.16, 0.2, 0.17]);
      k.add(shapes.cone(), a.accent, { p: [0, -0.24, 0.09], r: [Math.PI, 0, 0], s: [0.045, 0.13, 0.045] });
      k.ball('#F9A8D4', [0, -0.08, 0.16], [0.045, 0.025, 0.02]);
      k.ball('#FACC15', [-0.07, 0.05, 0.14], 0.04);
      k.ball('#FACC15', [0.07, 0.05, 0.14], 0.04);
      k.add(shapes.box(), '#1B1530', { p: [-0.07, 0.05, 0.178], s: [0.045, 0.014, 0.01] });
      k.add(shapes.box(), '#1B1530', { p: [0.07, 0.05, 0.178], s: [0.045, 0.014, 0.01] });
      break;
    case 'penguin':
      k.ball(a.color, [0, 0, 0], 0.2);
      k.ball(a.accent, [0, -0.01, 0.12], [0.15, 0.14, 0.1]);
      k.add(shapes.cone(), '#F2994A', { p: [0, -0.04, 0.24], r: [Math.PI / 2, 0, 0], s: [0.04, 0.09, 0.04] });
      k.eye([-0.06, 0.04, 0.2], 0.035);
      k.eye([0.06, 0.04, 0.2], 0.035);
      break;
  }
}

function legs(k: Kit, id: AnimalId) {
  const a = ANIMALS[id];
  switch (a.legs) {
    case 'bird':
      for (const x of [-0.1, 0.1]) {
        k.add(shapes.cylinder(), '#F2994A', { p: [x, 0.09, 0], s: [0.025, 0.18, 0.025] });
        k.ball('#F2994A', [x, 0.015, 0.04], [0.06, 0.018, 0.08]);
      }
      break;
    case 'paws':
      for (const x of [-0.12, 0.12]) k.ball(shade(a.color, 0.8), [x, 0.08, 0.02], [0.08, 0.09, 0.08]);
      break;
    case 'hooves':
      for (const x of [-0.1, 0.1]) {
        k.add(shapes.cylinder(), a.color, { p: [x, 0.11, 0], s: [0.035, 0.16, 0.035] });
        k.add(shapes.cylinder(), '#3F3F46', { p: [x, 0.025, 0], s: [0.042, 0.05, 0.042] });
      }
      break;
    case 'tentacles':
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const dx = Math.cos(angle);
        const dz = Math.sin(angle);
        k.add(
          shapes.tube(`tent${i}`, [[dx * 0.1, 0.2, dz * 0.1], [dx * 0.24, 0.07, dz * 0.24], [dx * 0.36, 0.04, dz * 0.33]], 0.04),
          a.color,
        );
      }
      break;
    case 'slime':
      k.ball(shade(a.color, 1.1), [0, 0.035, 0.02], [0.38, 0.05, 0.32]);
      break;
  }
}

function defaultBody(k: Kit, id: AnimalId, y: number) {
  const a = ANIMALS[id];
  if (id === 'snail') {
    k.ball(a.accent, [0, y + 0.12, -0.2], 0.22);
    k.add(shapes.torus(0.12, 0.035), shade(a.accent, 0.7), { p: [0, y + 0.12, -0.2], r: [0, Math.PI / 2, 0] });
  }
  k.ball(a.color, [0, y, 0], [0.3, 0.28, 0.26]);
  k.ball(id === 'penguin' ? a.accent : shade(a.color, 1.25), [0, y - 0.03, 0.12], [0.19, 0.19, 0.15]);
}

/** Draws an object. "worn" draws the version used on a creature (no umbrella handle, flat donut). */
function object(k: Kit, id: ObjectId, worn: boolean) {
  switch (id) {
    case 'toaster':
      k.add(shapes.roundBox(0.13, 0.13, 0.04, 0.02), '#E0A96D', { p: [-0.12, 0.55, 0] });
      k.add(shapes.roundBox(0.13, 0.13, 0.04, 0.02), '#E0A96D', { p: [0.12, 0.55, 0] });
      k.add(shapes.roundBox(0.58, 0.42, 0.38, 0.07), '#C9D1D9', { p: [0, 0.3, 0] });
      k.add(shapes.box(), '#374151', { p: [-0.12, 0.51, 0], s: [0.17, 0.02, 0.07] });
      k.add(shapes.box(), '#374151', { p: [0.12, 0.51, 0], s: [0.17, 0.02, 0.07] });
      k.add(shapes.box(), '#6B7280', { p: [0.3, 0.33, 0], s: [0.04, 0.09, 0.05] });
      k.add(shapes.cylinder(), '#6B7280', { p: [-0.17, 0.22, 0.19], r: [Math.PI / 2, 0, 0], s: [0.04, 0.02, 0.04] });
      break;
    case 'phone':
      k.add(shapes.roundBox(0.38, 0.58, 0.08, 0.04), '#1F2937', { p: [0, 0.36, 0] });
      k.add(shapes.box(), '#60A5FA', { p: [0, 0.35, 0.041], s: [0.32, 0.48, 0.01] });
      for (const [x, y, c] of [
        [-0.09, 0.42, '#F472B6'],
        [0, 0.42, '#FBBF24'],
        [0.09, 0.42, '#34D399'],
        [-0.09, 0.32, '#A78BFA'],
        [0, 0.32, '#F87171'],
      ] as [number, number, string][]) {
        k.add(shapes.roundBox(0.07, 0.07, 0.01, 0.015), c, { p: [x, y, 0.048] });
      }
      break;
    case 'microwave':
      k.add(shapes.roundBox(0.64, 0.4, 0.4, 0.05), '#E5E7EB', { p: [0, 0.28, 0] });
      k.add(shapes.box(), '#374151', { p: [-0.08, 0.28, 0.2], s: [0.36, 0.28, 0.01] });
      k.add(shapes.box(), '#FDE68A', { p: [-0.08, 0.28, 0.203], s: [0.3, 0.22, 0.005] });
      for (const y of [0.37, 0.29]) {
        k.add(shapes.cylinder(), '#6B7280', { p: [0.22, y, 0.2], r: [Math.PI / 2, 0, 0], s: [0.03, 0.02, 0.03] });
      }
      k.add(shapes.box(), '#34D399', { p: [0.22, 0.19, 0.2], s: [0.1, 0.04, 0.01] });
      break;
    case 'cone':
      k.add(shapes.box(), '#EA580C', { p: [0, 0.02, 0], s: [0.34, 0.04, 0.34] });
      k.add(shapes.cone(), '#F97316', { p: [0, 0.2, 0], s: [0.14, 0.34, 0.14] });
      k.add(shapes.cylinder(), '#FFFFFF', { p: [0, 0.17, 0], s: [0.105, 0.05, 0.105] });
      k.add(shapes.cylinder(), '#FFFFFF', { p: [0, 0.27, 0], s: [0.065, 0.04, 0.065] });
      break;
    case 'umbrella': {
      const slices = 8;
      for (let i = 0; i < slices; i++) {
        k.add(shapes.domeSlice((i / slices) * Math.PI * 2, (Math.PI * 2) / slices), i % 2 ? '#FFFFFF' : '#EF4444', {
          p: [0, 0.32, 0],
          s: [0.36, 0.18, 0.36],
        });
      }
      k.add(shapes.cylinder(), '#6B7280', { p: [0, 0.52, 0], s: [0.015, 0.06, 0.015] });
      if (!worn) {
        k.add(shapes.cylinder(), '#6B7280', { p: [0, 0.17, 0], s: [0.015, 0.3, 0.015] });
        k.add(shapes.torus(0.04, 0.014, Math.PI), '#6B7280', { p: [-0.04, 0.02, 0], r: [0, 0, Math.PI] });
      }
      break;
    }
    case 'donut':
      if (worn) {
        // A pool float around the waist.
        k.add(shapes.torus(0.3, 0.1), '#E9B872', { p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0] });
        k.add(shapes.torus(0.3, 0.085), '#F472B6', { p: [0, 0.33, 0], r: [Math.PI / 2, 0, 0] });
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          k.add(shapes.box(), ['#FDE68A', '#60A5FA', '#FFFFFF', '#34D399'][i % 4], {
            p: [Math.cos(angle) * 0.3, 0.42, Math.sin(angle) * 0.3],
            r: [0, angle * 3, 0],
            s: [0.05, 0.015, 0.015],
          });
        }
      } else {
        k.add(shapes.torus(0.2, 0.1), '#E9B872', { p: [0, 0.33, 0] });
        k.add(shapes.torus(0.2, 0.085), '#F472B6', { p: [0, 0.33, 0.035] });
        for (let i = 0; i < 9; i++) {
          const angle = (i / 9) * Math.PI * 2;
          k.add(shapes.box(), ['#FDE68A', '#60A5FA', '#FFFFFF', '#34D399'][i % 4], {
            p: [Math.cos(angle) * 0.2, 0.33 + Math.sin(angle) * 0.2, 0.12],
            r: [0, 0, angle * 2],
            s: [0.05, 0.015, 0.015],
          });
        }
      }
      break;
    case 'chair':
      k.add(shapes.roundBox(0.5, 0.42, 0.08, 0.04), '#64748B', { p: [0, 0.62, -0.22] });
      k.add(shapes.roundBox(0.56, 0.08, 0.48, 0.03), '#94A3B8', { p: [0, 0.22, 0] });
      for (const x of [-0.3, 0.3]) {
        k.add(shapes.box(), '#94A3B8', { p: [x, 0.38, 0], s: [0.06, 0.04, 0.34] });
        k.add(shapes.cylinder(), '#94A3B8', { p: [x, 0.3, 0], s: [0.02, 0.14, 0.02] });
      }
      k.add(shapes.cylinder(), '#CBD5E1', { p: [0, 0.12, 0], s: [0.03, 0.14, 0.03] });
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        k.add(shapes.box(), '#CBD5E1', { p: [Math.cos(angle) * 0.13, 0.05, Math.sin(angle) * 0.13], r: [0, -angle, 0], s: [0.26, 0.03, 0.04] });
        k.ball('#1F2937', [Math.cos(angle) * 0.25, 0.03, Math.sin(angle) * 0.25], 0.035);
      }
      break;
    case 'tuba':
      if (worn) {
        k.add(shapes.torus(0.33, 0.055), '#F2C94C', { p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0] });
        k.add(shapes.cylinder(), '#F2C94C', { p: [0.3, 0.45, 0], r: [0, 0, -0.35], s: [0.05, 0.3, 0.05] });
        k.add(shapes.openCone(0.15, 0.24), '#E0B23A', { p: [0.38, 0.68, 0], r: [0, 0, 2.8] });
        for (const x of [-0.08, 0, 0.08]) k.add(shapes.cylinder(), '#D4A82C', { p: [x, 0.38, 0.34], s: [0.025, 0.12, 0.025] });
      } else {
        k.add(shapes.torus(0.2, 0.06), '#F2C94C', { p: [0, 0.3, 0] });
        k.add(shapes.openCone(0.15, 0.3), '#E0B23A', { p: [0.2, 0.5, 0], r: [0, 0, 2.6] });
        for (const x of [-0.08, 0, 0.08]) k.add(shapes.cylinder(), '#D4A82C', { p: [x, 0.5, 0.06], s: [0.025, 0.12, 0.025] });
        k.add(shapes.cylinder(), '#D4A82C', { p: [-0.24, 0.42, 0], r: [0, 0, 0.9], s: [0.02, 0.16, 0.02] });
      }
      break;
  }
}

/** Height of the top of each "body" object, so the head can sit on it. */
const BODY_TOP: Partial<Record<ObjectId, number>> = { toaster: 0.52, phone: 0.64, microwave: 0.48 };

const geometryCache = new Map<string, THREE.BufferGeometry>();

export function creatureGeometry(id: CreatureId): THREE.BufferGeometry {
  const hit = geometryCache.get(id);
  if (hit) return hit;
  const { animal, object: objectId } = parseCreatureId(id);
  const mount = OBJECTS[objectId].mount;
  const k = new Kit();
  let headY: number;

  if (mount === 'body') {
    legs(k, animal);
    k.frame([0, 0.1, 0]);
    object(k, objectId, true);
    k.frame([0, 0, 0]);
    headY = 0.1 + (BODY_TOP[objectId] ?? 0.5) + HEAD_RADIUS * 0.8;
  } else if (mount === 'base') {
    object(k, objectId, true);
    defaultBody(k, animal, 0.5);
    headY = 0.5 + 0.28 + HEAD_RADIUS * 0.75;
  } else {
    legs(k, animal);
    defaultBody(k, animal, 0.4);
    if (mount === 'wrap') {
      k.frame([0, 0.06, 0]);
      object(k, objectId, true);
      k.frame([0, 0, 0]);
    }
    headY = 0.4 + 0.28 + HEAD_RADIUS * 0.75;
  }

  k.frame([0, headY, 0]);
  head(k, animal);
  if (mount === 'hat') {
    k.frame([0, headY + HEAD_RADIUS * (objectId === 'cone' ? 0.85 : 0.55), 0], objectId === 'cone' ? 0.75 : 0.7);
    object(k, objectId, true);
  }
  const g = k.build();
  geometryCache.set(id, g);
  return g;
}

export function ingredientGeometry(id: IngredientId): THREE.BufferGeometry {
  const hit = geometryCache.get(id);
  if (hit) return hit;
  const k = new Kit();
  if (isAnimal(id)) {
    k.frame([0, 0.42, 0], 1.45);
    head(k, id);
  } else {
    const scale: Partial<Record<ObjectId, number>> = { cone: 1.6, umbrella: 1.25, chair: 1.0 };
    k.frame([0, 0, 0], scale[id as ObjectId] ?? 1.1);
    object(k, id as ObjectId, false);
  }
  const g = k.build();
  geometryCache.set(id, g);
  return g;
}

export const toyMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05 });
export const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#2B2350' });

export type Vec = V3;
