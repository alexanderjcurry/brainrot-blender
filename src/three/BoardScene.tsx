import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { getCreature } from '../game/creatures';
import { BOARD_COLS, BOARD_ROWS, BOARD_SIZE, Cell } from '../game/state';
import { fitCamera } from './fit';
import { Kit, shapes } from './kit';
import { creatureGeometry, ingredientGeometry, toyMaterial } from './models';

// The 3D board: tiles on a floating platform, creatures that bob around,
// a blender that fires ingredients onto the board, and a sell pad at the front.

const STEP = 1.08;
const SELL_Z = (BOARD_ROWS / 2) * STEP + 0.62;
const BLENDER_Z = -(BOARD_ROWS / 2) * STEP - 1.05;
const BLENDER_MOUTH = new THREE.Vector3(0, 1.75, BLENDER_Z);
const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function cellPosition(index: number): [number, number, number] {
  const col = index % BOARD_COLS;
  const row = Math.floor(index / BOARD_COLS);
  return [(col - (BOARD_COLS - 1) / 2) * STEP, 0, (row - (BOARD_ROWS - 1) / 2) * STEP];
}

function targetAt(x: number, z: number): number | 'sell' | null {
  if (z > (BOARD_ROWS / 2) * STEP + 0.2 && Math.abs(x) < (BOARD_COLS / 2) * STEP + 0.3) return 'sell';
  const col = Math.round(x / STEP + (BOARD_COLS - 1) / 2);
  const row = Math.round(z / STEP + (BOARD_ROWS - 1) / 2);
  if (col < 0 || col >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) return null;
  return row * BOARD_COLS + col;
}

// ---------- Shared geometry and materials ----------

const tileGeometry = shapes.roundBox(0.96, 0.08, 0.96, 0.04);
const platformGeometry = shapes.roundBox(BOARD_COLS * STEP + 0.3, 0.3, BOARD_ROWS * STEP + 0.3, 0.12);
const blobGeometry = new THREE.CircleGeometry(0.36, 24);
const ringGeometry = new THREE.RingGeometry(0.37, 0.45, 40);
const hitGeometry = new THREE.BoxGeometry(0.9, 1.0, 0.9);

const materials = {
  platform: new THREE.MeshStandardMaterial({ color: '#241B4A', roughness: 0.8 }),
  tile: new THREE.MeshStandardMaterial({ color: '#3A2F70', roughness: 0.7 }),
  tileHover: new THREE.MeshStandardMaterial({ color: '#6D5BD0', roughness: 0.7 }),
  tileSelected: new THREE.MeshStandardMaterial({ color: '#A3E635', roughness: 0.6 }),
  blob: new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }),
  hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  sell: new THREE.MeshStandardMaterial({ color: '#7F1D1D', roughness: 0.7 }),
  sellHot: new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.6, emissive: '#7F1D1D' }),
  glass: new THREE.MeshStandardMaterial({ color: '#BFE9FF', transparent: true, opacity: 0.32, roughness: 0.1, depthWrite: false }),
};

const ringMaterials = new Map<string, THREE.MeshBasicMaterial>();
function ringMaterial(color: string) {
  let m = ringMaterials.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color });
    ringMaterials.set(color, m);
  }
  return m;
}

const pipCache = new Map<number, THREE.BufferGeometry>();
/** Gold dots in front of a creature, one per level. */
function pipGeometry(level: number) {
  let g = pipCache.get(level);
  if (!g) {
    const k = new Kit();
    for (let i = 0; i < level; i++) {
      const angle = Math.PI / 2 + (i - (level - 1) / 2) * 0.32;
      k.ball('#FBBF24', [Math.cos(angle) * 0.47, 0.07, Math.sin(angle) * 0.47], 0.05);
    }
    g = k.build();
    pipCache.set(level, g);
  }
  return g;
}

const blenderGeometry = (() => {
  const k = new Kit();
  k.add(shapes.roundBox(1.0, 0.5, 1.0, 0.12), '#F472B6', { p: [0, 0.25, 0] });
  k.add(shapes.box(), '#140F2A', { p: [0, 0.27, 0.5], s: [0.5, 0.16, 0.02] });
  k.ball('#A3E635', [-0.15, 0.27, 0.52], 0.05);
  k.ball('#FBBF24', [0.15, 0.27, 0.52], 0.05);
  k.add(shapes.cylinder(), '#DB2777', { p: [0, 1.62, 0], s: [0.44, 0.1, 0.44] });
  k.add(shapes.cylinder(), '#DB2777', { p: [0, 1.72, 0], s: [0.08, 0.1, 0.08] });
  return k.build();
})();
const bladeGeometry = (() => {
  const k = new Kit();
  k.add(shapes.box(), '#E5E7EB', { p: [0, 0, 0], s: [0.55, 0.02, 0.08] });
  k.add(shapes.box(), '#E5E7EB', { p: [0, 0, 0], r: [0, Math.PI / 2, 0], s: [0.55, 0.02, 0.08] });
  return k.build();
})();
const jarGeometry = new THREE.CylinderGeometry(0.42, 0.34, 1.1, 24, 1, true);

const trashGeometry = (() => {
  const k = new Kit();
  k.add(shapes.cylinder(), '#9CA3AF', { p: [0, 0.22, 0], s: [0.2, 0.44, 0.2] });
  k.add(shapes.cylinder(), '#6B7280', { p: [0, 0.47, 0], s: [0.23, 0.05, 0.23] });
  k.add(shapes.box(), '#6B7280', { p: [0, 0.52, 0], s: [0.12, 0.04, 0.04] });
  for (const x of [-0.08, 0, 0.08]) k.add(shapes.box(), '#6B7280', { p: [x, 0.22, 0.19], s: [0.025, 0.3, 0.025] });
  return k.build();
})();

// ---------- Effects ----------

type CellFx = 'spawn' | 'create' | undefined;
interface Burst {
  id: number;
  index: number;
  color: string;
}

/** Works out what just happened on the board, so new tiles can animate in. */
function diffBoards(prev: Cell[], next: Cell[]): { fx: Record<number, CellFx>; bursts: Omit<Burst, 'id'>[] } {
  const fx: Record<number, CellFx> = {};
  const bursts: Omit<Burst, 'id'>[] = [];
  const filled = (b: Cell[]) => b.filter(Boolean).length;
  const spawned = filled(next) === filled(prev) + 1;
  for (let i = 0; i < next.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (!b) continue;
    if (!a && b.kind === 'ingredient' && spawned) fx[i] = 'spawn';
    if (
      b.kind === 'creature' &&
      a &&
      (a.kind === 'ingredient' || (a.kind === 'creature' && a.id === b.id && b.level === a.level + 1))
    ) {
      fx[i] = 'create';
      bursts.push({ index: i, color: getCreature(b.id).rarity.color });
    }
  }
  return { fx, bursts };
}

function BurstFx({ burst, onDone }: { burst: Burst; onDone: (id: number) => void }) {
  const group = useRef<THREE.Group>(null);
  const age = useRef(0);
  const [material] = useState(() => new THREE.MeshBasicMaterial({ color: burst.color, transparent: true }));
  const [dirs] = useState(() =>
    Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * 1.6, 2.2 + (i % 3) * 0.6, Math.sin(angle) * 1.6);
    }),
  );
  const home = cellPosition(burst.index);
  useFrame((_, dt) => {
    age.current += dt;
    const t = age.current;
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const d = dirs[i];
      child.position.set(d.x * t, 0.4 + d.y * t - 4.5 * t * t, d.z * t);
    });
    // All particles share one material; fade it through the scene graph.
    const shared = (g.children[0] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined;
    if (shared) shared.opacity = Math.max(0, 1 - t / 0.7);
    if (t > 0.7) onDone(burst.id);
  });
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group ref={group} position={home}>
      {dirs.map((_, i) => (
        <mesh key={i} geometry={shapes.sphere()} material={material} scale={0.06} />
      ))}
    </group>
  );
}

// ---------- Pieces ----------

interface DragState {
  index: number;
  moved: boolean;
  x: number;
  z: number;
  startX: number;
  startZ: number;
}

function CellContent({
  index,
  cell,
  fx,
  selected,
  dragRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  index: number;
  cell: NonNullable<Cell>;
  fx: CellFx;
  selected: boolean;
  dragRef: React.RefObject<DragState | null>;
  onPointerDown: (index: number, e: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const age = useRef(0);
  const home = useMemo(() => new THREE.Vector3(...cellPosition(index)), [index]);
  const isCreature = cell.kind === 'creature';
  const geometry = isCreature ? creatureGeometry(cell.id) : ingredientGeometry(cell.id);
  const rarity = isCreature ? getCreature(cell.id).rarity : null;
  const levelScale = isCreature ? 1.06 + (cell.level - 1) * 0.06 : 1.0;

  useFrame((state, dt) => {
    const g = group.current;
    const b = body.current;
    if (!g || !b) return;
    age.current += dt;
    const t = state.clock.elapsedTime;
    const drag = dragRef.current;
    const dragged = !!drag && drag.index === index && drag.moved;

    if (fx === 'spawn' && age.current < 0.45) {
      // Fly from the blender to the tile in an arc.
      const p = age.current / 0.45;
      g.position.lerpVectors(BLENDER_MOUTH, home, p);
      g.position.y += Math.sin(p * Math.PI) * 1.6;
    } else {
      const target = dragged ? new THREE.Vector3(drag.x, 0.75, drag.z) : home;
      g.position.lerp(target, 1 - Math.exp(-dt * (dragged ? 30 : 14)));
    }

    // Pop in with a little overshoot.
    const p = Math.min(1, age.current / 0.4);
    const pop = fx === 'create' || fx === 'spawn' ? 1 + 0.6 * Math.sin(p * Math.PI) * (1 - p) - 0.4 * (1 - p) : 1;
    const wobble = Math.sin(t * 4 + index) * 0.035;
    b.scale.set(levelScale * pop * (1 - wobble / 2), levelScale * pop * (1 + wobble), levelScale * pop * (1 - wobble / 2));
    b.position.y = isCreature ? 0.04 + (selected ? 0.18 : 0) : 0.12 + Math.sin(t * 2 + index) * 0.05;
    b.rotation.y = Math.sin(t * (isCreature ? 0.9 : 1.3) + index * 1.7) * (isCreature ? 0.35 : 0.6);
  });

  return (
    <group ref={group} position={fx === 'spawn' ? BLENDER_MOUTH : home}>
      <mesh geometry={blobGeometry} material={materials.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} />
      {rarity && (
        <>
          <mesh geometry={ringGeometry} material={ringMaterial(rarity.color)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} />
          <mesh geometry={pipGeometry(cell.kind === 'creature' ? cell.level : 1)} material={toyMaterial} />
        </>
      )}
      <group ref={body}>
        <mesh geometry={geometry} material={toyMaterial} />
      </group>
      <mesh
        geometry={hitGeometry}
        material={materials.hit}
        position={[0, 0.5, 0]}
        onPointerDown={(e) => onPointerDown(index, e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </group>
  );
}

function Blender({ blendCount }: { blendCount: number }) {
  const shake = useRef(0);
  const jar = useRef<THREE.Group>(null);
  const blades = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (blendCount > 0) shake.current = 0.45;
  }, [blendCount]);
  useFrame((state, dt) => {
    shake.current = Math.max(0, shake.current - dt);
    const s = shake.current;
    if (jar.current) {
      jar.current.rotation.z = Math.sin(state.clock.elapsedTime * 60) * 0.06 * (s / 0.45);
      jar.current.position.y = s > 0 ? Math.abs(Math.sin(state.clock.elapsedTime * 30)) * 0.08 : 0;
    }
    if (blades.current) blades.current.rotation.y += dt * (s > 0 ? 40 : 1.5);
  });
  return (
    <group position={[0, 0, BLENDER_Z]}>
      <group ref={jar}>
        <mesh geometry={blenderGeometry} material={toyMaterial} />
        <mesh ref={blades} geometry={bladeGeometry} material={toyMaterial} position={[0, 0.62, 0]} />
        <mesh geometry={jarGeometry} material={materials.glass} position={[0, 1.07, 0]} />
      </group>
    </group>
  );
}

function SellPad({ hot }: { hot: boolean }) {
  const width = BOARD_COLS * STEP + 0.3;
  return (
    <group position={[0, -0.1, SELL_Z]}>
      <mesh geometry={shapes.roundBox(width, 0.2, 0.7, 0.08)} material={hot ? materials.sellHot : materials.sell} />
      <mesh geometry={trashGeometry} material={toyMaterial} position={[0, 0.1, 0]} scale={hot ? 1.1 : 0.85} />
    </group>
  );
}

/** Points that must stay on screen: board corners, the sell pad and the blender. */
const HALF_W = (BOARD_COLS * STEP + 0.3) / 2;
const FIT_POINTS = [
  new THREE.Vector3(-HALF_W, 0, -(BOARD_ROWS * STEP) / 2 - 0.15),
  new THREE.Vector3(HALF_W, 0, -(BOARD_ROWS * STEP) / 2 - 0.15),
  new THREE.Vector3(-HALF_W, 0, SELL_Z + 0.35),
  new THREE.Vector3(HALF_W, 0, SELL_Z + 0.35),
  new THREE.Vector3(-HALF_W, -0.3, SELL_Z + 0.35),
  new THREE.Vector3(HALF_W, -0.3, SELL_Z + 0.35),
  new THREE.Vector3(0, 1.85, BLENDER_Z),
];

// Aim points along the board's length; the fit picks whichever allows the closest camera.
const AIMS = Array.from({ length: 17 }, (_, i) => new THREE.Vector3(0, 0, -1.6 + i * 0.2));

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    // A three-quarter view: low enough to see faces, high enough that
    // creatures don't hide the row behind them.
    fitCamera(camera as THREE.PerspectiveCamera, size.width, size.height, FIT_POINTS, { elevation: 57, aims: AIMS, limit: 0.96 });
  }, [camera, size.width, size.height]);
  return null;
}

/** Web only: lets automated browser tests find where a tile is on screen. */
function TestBridge() {
  const { camera, gl } = useThree();
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const toScreen = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      const rect = gl.domElement.getBoundingClientRect();
      return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
    };
    const w = globalThis as unknown as Record<string, unknown>;
    w.__bbCell = (i: number) => {
      const [x, , z] = cellPosition(i);
      return toScreen(x, 0.3, z);
    };
    w.__bbSell = () => toScreen(0.8, 0, SELL_Z);
  }, [camera, gl]);
  return null;
}

// ---------- Board ----------

export interface BoardSceneProps {
  board: Cell[];
  selected: number | null;
  blendCount: number;
  onSelect: (index: number | null) => void;
  onDrop: (from: number, to: number) => void;
  onSell: (from: number) => void;
}

export function BoardScene({ board, selected, blendCount, onSelect, onDrop, onSell }: BoardSceneProps) {
  const dragRef = useRef<DragState | null>(null);
  const [hover, setHover] = useState<number | 'sell' | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);
  const [fx, setFx] = useState<Record<number, CellFx>>({});
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [burstId, setBurstId] = useState(0);

  // Compare with the previous board during render (React's recommended pattern).
  if (board !== prevBoard) {
    const d = diffBoards(prevBoard, board);
    setPrevBoard(board);
    setFx(d.fx);
    if (d.bursts.length) {
      setBursts((b) => [...b, ...d.bursts.map((x, i) => ({ ...x, id: burstId + i }))]);
      setBurstId(burstId + d.bursts.length);
    }
  }

  const removeBurst = useCallback((id: number) => setBursts((b) => b.filter((x) => x.id !== id)), []);

  const handleTap = useCallback(
    (index: number) => {
      if (selected === null) {
        if (board[index]) onSelect(index);
        return;
      }
      if (selected === index) return onSelect(null);
      onDrop(selected, index);
      onSelect(null);
    },
    [board, selected, onDrop, onSelect],
  );

  const groundPoint = (e: ThreeEvent<PointerEvent>) => e.ray.intersectPlane(GROUND, new THREE.Vector3());

  const onPointerDown = useCallback((index: number, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const p = groundPoint(e);
    if (!p) return;
    (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { index, moved: false, x: p.x, z: p.z, startX: p.x, startZ: p.z };
  }, []);

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = groundPoint(e);
    if (!p) return;
    drag.x = p.x;
    drag.z = p.z;
    if (!drag.moved && Math.hypot(p.x - drag.startX, p.z - drag.startZ) > 0.25) drag.moved = true;
    if (drag.moved) {
      const t = targetAt(p.x, p.z);
      setHover((h) => (h === t ? h : t));
    }
  }, []);

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.stopPropagation();
      (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
      dragRef.current = null;
      setHover(null);
      if (!drag.moved) return handleTap(drag.index);
      const target = targetAt(drag.x, drag.z);
      onSelect(null);
      if (target === 'sell') onSell(drag.index);
      else if (target !== null && target !== drag.index) onDrop(drag.index, target);
    },
    [handleTap, onDrop, onSell, onSelect],
  );

  return (
    <View style={styles.wrap}>
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ fov: 26, near: 0.1, far: 100 }}
        // Measure layout size, not on-screen size, so pop-in animations don't shrink the render.
        resize={{ offsetSize: true }}
        onPointerMissed={() => onSelect(null)}
      >
        <color attach="background" args={['#140F2A']} />
        <CameraRig />
        <TestBridge />
        <hemisphereLight args={['#FFFFFF', '#3B2F70', 1.25]} />
        <directionalLight position={[3, 9, 6]} intensity={1.7} />

        <mesh geometry={platformGeometry} material={materials.platform} position={[0, -0.2, 0]} />
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <mesh
            key={i}
            geometry={tileGeometry}
            material={selected === i ? materials.tileSelected : hover === i ? materials.tileHover : materials.tile}
            position={cellPosition(i)}
            onClick={(e) => {
              e.stopPropagation();
              if (!board[i]) handleTap(i);
            }}
          />
        ))}

        {board.map((cell, i) =>
          cell ? (
            <CellContent
              key={`${i}:${cell.kind === 'creature' ? `${cell.id}:${cell.level}` : cell.id}`}
              index={i}
              cell={cell}
              fx={fx[i]}
              selected={selected === i}
              dragRef={dragRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          ) : null,
        )}

        {bursts.map((b) => (
          <BurstFx key={b.id} burst={b} onDone={removeBurst} />
        ))}
        <Blender blendCount={blendCount} />
        <SellPad hot={hover === 'sell'} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    // Stop the browser from scrolling or zooming while dragging on the board.
    touchAction: 'none',
    userSelect: 'none',
  } as never,
});
