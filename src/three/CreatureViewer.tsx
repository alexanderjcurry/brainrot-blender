import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as THREE from 'three';
import { CreatureId, getCreature } from '../game/creatures';
import { fitCamera } from './fit';
import { creatureGeometry, silhouetteMaterial, toyMaterial } from './models';

const pedestalMaterial = new THREE.MeshStandardMaterial({ color: '#2A2150', roughness: 0.6 });
const pedestalGeometry = new THREE.CylinderGeometry(0.62, 0.7, 0.18, 40);
const ringGeometry = new THREE.TorusGeometry(0.64, 0.03, 8, 48);
const glowMaterials = new Map<string, THREE.MeshBasicMaterial>();
function glow(color: string) {
  let m = glowMaterials.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color });
    glowMaterials.set(color, m);
  }
  return m;
}

function Spinner({ id, hidden }: { id: CreatureId; hidden: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * 0.9;
    const t = state.clock.elapsedTime;
    g.position.y = 0.02 + Math.abs(Math.sin(t * 2.4)) * 0.06;
    const squash = Math.sin(t * 4.8) * 0.03;
    g.scale.set(1 - squash / 2, 1 + squash, 1 - squash / 2);
  });
  return (
    <group ref={group}>
      <mesh geometry={creatureGeometry(id)} material={hidden ? silhouetteMaterial : toyMaterial} />
    </group>
  );
}

/**
 * Points around the spinning creature and its pedestal that must stay in view.
 * The creature turns, so each height band is swept into a ring as wide as the
 * widest part at that height (a narrow head doesn't need as much room as a tuba).
 */
function framePoints(id: CreatureId): THREE.Vector3[] {
  const geometry = creatureGeometry(id);
  const position = geometry.getAttribute('position');
  const box = geometry.boundingBox ?? new THREE.Box3().setFromBufferAttribute(position as THREE.BufferAttribute);
  const bands = 8;
  const span = Math.max(1e-3, box.max.y - box.min.y);
  const reach = new Array<number>(bands).fill(0);
  for (let i = 0; i < position.count; i++) {
    const band = Math.min(bands - 1, Math.floor(((position.getY(i) - box.min.y) / span) * bands));
    reach[band] = Math.max(reach[band], Math.hypot(position.getX(i), position.getZ(i)));
  }
  const points: THREE.Vector3[] = [];
  const ring = (radius: number, y: number) => {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
  };
  reach.forEach((radius, band) => {
    ring(radius, box.min.y + (band / bands) * span);
    ring(radius, (box.min.y + ((band + 1) / bands) * span) * 1.03 + 0.08); // squash-and-stretch plus the hop
  });
  ring(0.7, -0.18); // pedestal
  return points;
}

function FitViewer({ id }: { id: CreatureId }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const points = framePoints(id);
    const middle = (Math.max(...points.map((p) => p.y)) + Math.min(...points.map((p) => p.y))) / 2;
    fitCamera(camera as THREE.PerspectiveCamera, size.width, size.height, points, { elevation: 16, aims: [new THREE.Vector3(0, middle, 0)], limit: 0.92 });
  }, [camera, id, size.width, size.height]);
  return null;
}

/** A creature spinning on a little pedestal, in its own 3D view. */
export function CreatureViewer({ id, size, hidden = false }: { id: CreatureId; size: number; hidden?: boolean }) {
  const color = getCreature(id).rarity.color;
  return (
    <View style={{ width: size, height: size }}>
      {/* Layout size, not on-screen size: the reveal card pops in with a scale animation. */}
      <Canvas flat dpr={[1, 2]} camera={{ fov: 30 }} resize={{ offsetSize: true }}>
        <FitViewer id={id} />
        <hemisphereLight args={['#FFFFFF', '#3B2F70', 1.3]} />
        <directionalLight position={[2, 4, 3]} intensity={1.8} />
        <mesh geometry={pedestalGeometry} material={pedestalMaterial} position={[0, -0.09, 0]} />
        {!hidden && <mesh geometry={ringGeometry} material={glow(color)} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} />}
        <Spinner id={id} hidden={hidden} />
      </Canvas>
    </View>
  );
}
