import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import { ANIMALS, AnimalId, IngredientId, OBJECTS, ObjectId, isAnimal } from '../game/content';
import { CreatureId, getCreature } from '../game/creatures';

// All art is simple vector shapes drawn in a 100 x 100 box.
// A creature is assembled from an animal head, a body, legs and an object,
// so each new animal or object multiplies the number of creatures.

const INK = '#1B1530';

function Eye({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r + 1.2} fill="#FFFFFF" />
      <Circle cx={x} cy={y} r={r * 0.75} fill={INK} />
      <Circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#FFFFFF" />
    </G>
  );
}

/** Animal heads, centred on the origin, roughly 32 units across. */
function Head({ id }: { id: AnimalId }) {
  const a = ANIMALS[id];
  switch (id) {
    case 'pigeon':
      return (
        <G>
          <Path d="M-12 8 Q0 20 12 8 L12 14 Q0 24 -12 14 Z" fill={a.accent} />
          <Circle cx={0} cy={0} r={14} fill={a.color} />
          <Eye x={-5.5} y={-2} />
          <Eye x={5.5} y={-2} />
          <Ellipse cx={0} cy={2.5} rx={2.6} ry={1.6} fill="#F1F5F9" />
          <Polygon points="-3,4 3,4 0,10" fill="#F2C94C" />
        </G>
      );
    case 'capybara':
      return (
        <G>
          <Circle cx={-12} cy={-11} r={4} fill={a.accent} />
          <Circle cx={12} cy={-11} r={4} fill={a.accent} />
          <Rect x={-16} y={-13} width={32} height={27} rx={12} fill={a.color} />
          <Ellipse cx={0} cy={6} rx={11} ry={7.5} fill={a.accent} />
          <Ellipse cx={-3.5} cy={4} rx={1.2} ry={1.8} fill={INK} />
          <Ellipse cx={3.5} cy={4} rx={1.2} ry={1.8} fill={INK} />
          {/* Half-closed, totally unbothered eyes. */}
          <Path d="M-10 -4 Q-7 -2 -4 -4" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M4 -4 Q7 -2 10 -4" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'hamster':
      return (
        <G>
          <Circle cx={-11} cy={-11} r={5} fill={a.color} />
          <Circle cx={-11} cy={-11} r={2.5} fill="#F9A8D4" />
          <Circle cx={11} cy={-11} r={5} fill={a.color} />
          <Circle cx={11} cy={-11} r={2.5} fill="#F9A8D4" />
          <Circle cx={0} cy={0} r={15} fill={a.color} />
          <Ellipse cx={-9} cy={6} rx={7} ry={6} fill={a.accent} />
          <Ellipse cx={9} cy={6} rx={7} ry={6} fill={a.accent} />
          <Eye x={-6} y={-3} r={2.4} />
          <Eye x={6} y={-3} r={2.4} />
          <Circle cx={0} cy={3} r={1.6} fill="#F472B6" />
        </G>
      );
    case 'octopus':
      return (
        <G>
          <Ellipse cx={0} cy={-2} rx={15} ry={16} fill={a.color} />
          <Circle cx={-7} cy={-11} r={2} fill={a.accent} />
          <Circle cx={6} cy={-13} r={1.5} fill={a.accent} />
          <Circle cx={9} cy={-7} r={1.2} fill={a.accent} />
          <Eye x={-6} y={3} r={3.4} />
          <Eye x={6} y={3} r={3.4} />
        </G>
      );
    case 'snail':
      return (
        <G>
          <Line x1={-5} y1={-6} x2={-8} y2={-18} stroke={a.color} strokeWidth={3} strokeLinecap="round" />
          <Line x1={5} y1={-6} x2={8} y2={-18} stroke={a.color} strokeWidth={3} strokeLinecap="round" />
          <Ellipse cx={0} cy={2} rx={12} ry={11} fill={a.color} />
          <Eye x={-8} y={-19} r={2.6} />
          <Eye x={8} y={-19} r={2.6} />
          <Path d="M-5 5 Q0 9 5 5" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'raccoon':
      return (
        <G>
          <Polygon points="-14,-6 -12,-18 -4,-12" fill={a.color} />
          <Polygon points="14,-6 12,-18 4,-12" fill={a.color} />
          <Circle cx={0} cy={0} r={15} fill={a.color} />
          <Path d="M-15 -3 Q-8 -9 0 -4 Q8 -9 15 -3 Q12 5 4 2 Q0 0 -4 2 Q-12 5 -15 -3 Z" fill={a.accent} />
          <Eye x={-7} y={-2} r={2.3} />
          <Eye x={7} y={-2} r={2.3} />
          <Ellipse cx={0} cy={8} rx={7} ry={5} fill="#F5F5F5" />
          <Ellipse cx={0} cy={6} rx={2.2} ry={1.5} fill={INK} />
        </G>
      );
    case 'goat':
      return (
        <G>
          <Path d="M-6 -12 Q-10 -22 -16 -20" stroke={a.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M6 -12 Q10 -22 16 -20" stroke={a.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Ellipse cx={-14} cy={-4} rx={6} ry={3} fill={a.color} />
          <Ellipse cx={14} cy={-4} rx={6} ry={3} fill={a.color} />
          <Ellipse cx={0} cy={0} rx={12} ry={15} fill={a.color} />
          <Polygon points="-4,12 4,12 0,22" fill={a.accent} />
          <Ellipse cx={-5} cy={-3} rx={3.2} ry={2.6} fill="#FACC15" />
          <Rect x={-7} y={-3.6} width={4} height={1.3} fill={INK} />
          <Ellipse cx={5} cy={-3} rx={3.2} ry={2.6} fill="#FACC15" />
          <Rect x={3} y={-3.6} width={4} height={1.3} fill={INK} />
          <Ellipse cx={0} cy={7} rx={3} ry={1.6} fill="#F9A8D4" />
        </G>
      );
    case 'penguin':
      return (
        <G>
          <Circle cx={0} cy={0} r={15} fill={a.color} stroke="#64748B" strokeWidth={1.5} />
          <Ellipse cx={0} cy={3} rx={10} ry={10} fill={a.accent} />
          <Eye x={-4.5} y={0} r={2.2} />
          <Eye x={4.5} y={0} r={2.2} />
          <Polygon points="-3.5,5 3.5,5 0,10" fill="#F2994A" />
        </G>
      );
  }
}

/** Objects, centred on the origin, roughly 50 units across. */
function ObjectShape({ id, worn = false, bodyColor }: { id: ObjectId; worn?: boolean; bodyColor?: string }) {
  switch (id) {
    case 'toaster':
      return (
        <G>
          <Rect x={-15} y={-24} width={10} height={8} rx={3} fill="#E0A96D" />
          <Rect x={5} y={-24} width={10} height={8} rx={3} fill="#E0A96D" />
          <Rect x={-24} y={-18} width={48} height={36} rx={8} fill="#C9D1D9" stroke="#8B949E" strokeWidth={1.5} />
          <Rect x={-16} y={-19} width={12} height={4} rx={1.5} fill="#374151" />
          <Rect x={4} y={-19} width={12} height={4} rx={1.5} fill="#374151" />
          <Rect x={24} y={-4} width={5} height={8} rx={1.5} fill="#6B7280" />
          <Circle cx={-14} cy={7} r={3.5} fill="#6B7280" />
          <Path d="M-20 -12 L-20 10" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
        </G>
      );
    case 'cone':
      return (
        <G>
          <Polygon points="-12,16 12,16 3,-22 -3,-22" fill="#F97316" />
          <Polygon points="-6.6,-4 6.6,-4 7.8,1 -7.8,1" fill="#FFFFFF" />
          <Polygon points="-9.5,7 9.5,7 10.4,11 -10.4,11" fill="#FFFFFF" />
          <Rect x={-17} y={14} width={34} height={6} rx={2} fill="#EA580C" />
        </G>
      );
    case 'phone':
      return (
        <G>
          <Rect x={-18} y={-24} width={36} height={48} rx={7} fill="#1F2937" />
          <Rect x={-15} y={-20} width={30} height={38} rx={3} fill="#60A5FA" />
          <Rect x={-11} y={-4} width={7} height={7} rx={2} fill="#F472B6" />
          <Rect x={-2} y={-4} width={7} height={7} rx={2} fill="#FBBF24" />
          <Rect x={7} y={-4} width={4} height={7} rx={2} fill="#34D399" />
          <Rect x={-11} y={6} width={7} height={7} rx={2} fill="#A78BFA" />
          <Rect x={-2} y={6} width={7} height={7} rx={2} fill="#F87171" />
          <Rect x={-6} y={20} width={12} height={2} rx={1} fill="#9CA3AF" />
        </G>
      );
    case 'microwave':
      return (
        <G>
          <Rect x={-26} y={-17} width={52} height={34} rx={5} fill="#E5E7EB" stroke="#9CA3AF" strokeWidth={1.5} />
          <Rect x={-22} y={-13} width={30} height={26} rx={3} fill="#374151" />
          <Rect x={-20} y={-11} width={26} height={22} rx={2} fill="#FDE68A" opacity={0.25} />
          <Ellipse cx={-7} cy={8} rx={10} ry={2.6} fill="#9CA3AF" />
          <Circle cx={17} cy={-8} r={2.5} fill="#6B7280" />
          <Circle cx={17} cy={0} r={2.5} fill="#6B7280" />
          <Rect x={13} y={6} width={8} height={4} rx={1.5} fill="#34D399" />
        </G>
      );
    case 'umbrella':
      return (
        <G>
          {!worn && (
            <Path d="M0 0 L0 22 Q0 28 -5 28 Q-9 28 -9 24" stroke="#6B7280" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          )}
          <Path
            d="M-28 0 Q-28 -26 0 -26 Q28 -26 28 0 Q21 -5 14 0 Q7 -5 0 0 Q-7 -5 -14 0 Q-21 -5 -28 0 Z"
            fill="#EF4444"
          />
          <Path d="M0 -26 Q-8 -14 -14 0 M0 -26 Q8 -14 14 0" stroke="#B91C1C" strokeWidth={1.5} fill="none" />
          <Line x1={0} y1={-26} x2={0} y2={-30} stroke="#6B7280" strokeWidth={2.5} strokeLinecap="round" />
        </G>
      );
    case 'donut':
      if (worn) {
        // A pool float around the waist.
        return (
          <G>
            <Ellipse cx={0} cy={0} rx={27} ry={10} fill="none" stroke="#E9B872" strokeWidth={10} />
            <Path d="M-27 -2 Q-14 -12 0 -10 Q14 -12 27 -2" stroke="#F472B6" strokeWidth={6} fill="none" strokeLinecap="round" />
            <Rect x={-16} y={-12} width={4} height={1.6} fill="#FDE68A" />
            <Rect x={-4} y={-13} width={4} height={1.6} fill="#60A5FA" />
            <Rect x={10} y={-12} width={4} height={1.6} fill="#FFFFFF" />
          </G>
        );
      }
      return (
        <G>
          <Circle cx={0} cy={0} r={22} fill="#E9B872" />
          <Path
            d="M-18 -2 Q-19 -17 -4 -19 Q12 -21 18 -6 Q21 4 14 10 Q8 6 2 12 Q-6 8 -12 12 Q-20 8 -18 -2 Z"
            fill="#F472B6"
          />
          <Circle cx={0} cy={0} r={6} fill={bodyColor ?? INK} />
          <Rect x={-12} y={-12} width={5} height={1.8} fill="#FDE68A" />
          <Rect x={6} y={-14} width={5} height={1.8} fill="#60A5FA" />
          <Rect x={9} y={-2} width={5} height={1.8} fill="#FFFFFF" />
          <Rect x={-13} y={2} width={5} height={1.8} fill="#34D399" />
        </G>
      );
    case 'chair':
      return (
        <G>
          <Rect x={-14} y={-24} width={28} height={22} rx={5} fill="#64748B" />
          <Rect x={-18} y={0} width={36} height={7} rx={3} fill="#94A3B8" />
          <Rect x={-2} y={7} width={4} height={8} fill="#CBD5E1" />
          <Line x1={-16} y1={16} x2={16} y2={16} stroke="#CBD5E1" strokeWidth={3} strokeLinecap="round" />
          <Circle cx={-16} cy={18} r={2.4} fill="#E2E8F0" />
          <Circle cx={0} cy={18} r={2.4} fill="#E2E8F0" />
          <Circle cx={16} cy={18} r={2.4} fill="#E2E8F0" />
        </G>
      );
    case 'tuba':
      return (
        <G>
          <Line x1={-14} y1={-4} x2={-24} y2={-12} stroke="#D4A82C" strokeWidth={3} strokeLinecap="round" />
          <Circle cx={0} cy={0} r={15} fill="none" stroke="#F2C94C" strokeWidth={8} />
          <Polygon points="8,-10 22,-28 32,-20 14,-4" fill="#F2C94C" />
          <Ellipse cx={27} cy={-24} rx={7} ry={3} fill="#D4A82C" transform="rotate(-50 27 -24)" />
          <Rect x={-8} y={-22} width={4} height={8} rx={1} fill="#D4A82C" />
          <Rect x={-2} y={-23} width={4} height={8} rx={1} fill="#D4A82C" />
          <Rect x={4} y={-22} width={4} height={8} rx={1} fill="#D4A82C" />
        </G>
      );
  }
}

function Legs({ id }: { id: AnimalId }) {
  const a = ANIMALS[id];
  switch (a.legs) {
    case 'bird':
      return (
        <G stroke="#F2994A" strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M42 80 L42 92 M38 94 L42 92 L46 94" />
          <Path d="M58 80 L58 92 M54 94 L58 92 L62 94" />
        </G>
      );
    case 'paws':
      return (
        <G>
          <Rect x={36} y={78} width={10} height={15} rx={5} fill={a.color} stroke="#00000033" strokeWidth={1} />
          <Rect x={54} y={78} width={10} height={15} rx={5} fill={a.color} stroke="#00000033" strokeWidth={1} />
        </G>
      );
    case 'hooves':
      return (
        <G>
          <Rect x={39} y={78} width={6} height={13} fill={a.color} stroke="#00000033" strokeWidth={1} />
          <Rect x={55} y={78} width={6} height={13} fill={a.color} stroke="#00000033" strokeWidth={1} />
          <Rect x={38} y={90} width={8} height={4} rx={1} fill="#3F3F46" />
          <Rect x={54} y={90} width={8} height={4} rx={1} fill="#3F3F46" />
        </G>
      );
    case 'tentacles':
      return (
        <G stroke={a.color} strokeWidth={4.5} strokeLinecap="round" fill="none">
          <Path d="M36 78 Q30 86 36 94" />
          <Path d="M45 80 Q41 88 46 95" />
          <Path d="M55 80 Q59 88 54 95" />
          <Path d="M64 78 Q70 86 64 94" />
        </G>
      );
    case 'slime':
      return <Ellipse cx={50} cy={90} rx={27} ry={5} fill={a.color} opacity={0.75} />;
  }
}

/** The office chair the creature sits in: backrest behind, seat and wheels below. */
function ChairBack() {
  return <Rect x={23} y={38} width={54} height={44} rx={9} fill="#64748B" />;
}

function ChairFront() {
  return (
    <G>
      <Rect x={20} y={78} width={60} height={8} rx={4} fill="#94A3B8" />
      <Rect x={16} y={62} width={14} height={5} rx={2.5} fill="#94A3B8" />
      <Rect x={70} y={62} width={14} height={5} rx={2.5} fill="#94A3B8" />
      <Rect x={21} y={66} width={4} height={13} fill="#94A3B8" />
      <Rect x={75} y={66} width={4} height={13} fill="#94A3B8" />
      <Rect x={48} y={86} width={4} height={6} fill="#CBD5E1" />
      <Line x1={30} y1={93} x2={70} y2={93} stroke="#CBD5E1" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={30} cy={96} r={2.6} fill="#E2E8F0" />
      <Circle cx={50} cy={96} r={2.6} fill="#E2E8F0" />
      <Circle cx={70} cy={96} r={2.6} fill="#E2E8F0" />
    </G>
  );
}

function DefaultBody({ id }: { id: AnimalId }) {
  const a = ANIMALS[id];
  return (
    <G>
      {id === 'snail' && <Circle cx={68} cy={60} r={14} fill={a.accent} stroke="#8A5A2B" strokeWidth={2} />}
      <Ellipse cx={50} cy={65} rx={21} ry={19} fill={a.color} stroke={id === 'penguin' ? '#64748B' : 'none'} strokeWidth={1.5} />
      <Ellipse cx={50} cy={69} rx={12} ry={11} fill={id === 'penguin' ? a.accent : '#FFFFFF'} opacity={id === 'penguin' ? 1 : 0.3} />
    </G>
  );
}

const RARITY_SPARKLES = [
  [14, 18],
  [86, 22],
  [12, 78],
  [88, 74],
];

export function CreatureArt({ id, size }: { id: CreatureId; size: number }) {
  const c = getCreature(id);
  const object = OBJECTS[c.object];
  const mount = object.mount;
  const headY = mount === 'body' ? 32 : 34;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={54} r={46} fill={c.rarity.color} opacity={0.16} />
      {c.rarity.id === 'cosmic' &&
        RARITY_SPARKLES.map(([x, y]) => (
          <Path key={`${x}-${y}`} d={`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z`} fill="#FBBF24" />
        ))}
      {mount === 'base' ? <ChairBack /> : <Legs id={c.animal} />}
      {mount === 'body' ? (
        <G transform="translate(50 64)">
          <ObjectShape id={c.object} bodyColor={ANIMALS[c.animal].color} />
        </G>
      ) : (
        <DefaultBody id={c.animal} />
      )}
      {mount === 'base' && <ChairFront />}
      {mount === 'wrap' && (
        <G transform={c.object === 'tuba' ? 'translate(50 66) scale(1.05)' : 'translate(50 72)'}>
          <ObjectShape id={c.object} worn />
        </G>
      )}
      <G transform={`translate(50 ${headY})`}>
        <Head id={c.animal} />
      </G>
      {mount === 'hat' && (
        <G transform={c.object === 'cone' ? 'translate(50 11) scale(0.5)' : 'translate(50 22) scale(0.8)'}>
          <ObjectShape id={c.object} worn />
        </G>
      )}
    </Svg>
  );
}

export function IngredientArt({ id, size }: { id: IngredientId; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {isAnimal(id) ? (
        <G transform="translate(50 54) scale(1.8)">
          <Head id={id} />
        </G>
      ) : (
        <G transform={id === 'umbrella' ? 'translate(50 50) scale(1.25)' : 'translate(50 52) scale(1.3)'}>
          <ObjectShape id={id as ObjectId} />
        </G>
      )}
    </Svg>
  );
}

/** Dark outline used for creatures the player has not discovered yet. */
export function MysteryArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={34} r={15} fill="#3B3160" />
      <Ellipse cx={50} cy={65} rx={21} ry={19} fill="#3B3160" />
      <Rect x={38} y={78} width={8} height={14} rx={4} fill="#3B3160" />
      <Rect x={54} y={78} width={8} height={14} rx={4} fill="#3B3160" />
    </Svg>
  );
}
