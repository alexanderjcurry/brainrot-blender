import {
  ALL_ANIMALS,
  ALL_OBJECTS,
  ANIMALS,
  AnimalId,
  OBJECTS,
  ObjectId,
  RARITIES,
  RarityInfo,
  SETS,
  SetId,
} from './content';
import { hashString } from './rng';

/** A creature id is always "<animal>+<object>", so the same pair always makes the same creature. */
export type CreatureId = `${AnimalId}+${ObjectId}`;

export interface Creature {
  id: CreatureId;
  animal: AnimalId;
  object: ObjectId;
  name: string;
  rarity: RarityInfo;
}

export function creatureId(animal: AnimalId, object: ObjectId): CreatureId {
  return `${animal}+${object}`;
}

export function parseCreatureId(id: CreatureId): { animal: AnimalId; object: ObjectId } {
  const [animal, object] = id.split('+') as [AnimalId, ObjectId];
  return { animal, object };
}

function article(word: string): string {
  return word.endsWith('a') ? 'La' : 'Il';
}

function makeName(animal: AnimalId, object: ObjectId, seed: number): string {
  const a = ANIMALS[animal];
  const o = OBJECTS[object];
  switch (seed % 5) {
    case 0:
      return `${a.word} ${o.word}`;
    case 1:
      return `${o.stem} ${o.stem} ${a.word}`;
    case 2:
      return `${a.stem}ni ${o.stem}ni`;
    case 3:
      return `${article(a.word)} ${a.word} ${o.word}`;
    default:
      return `${a.word} ${o.stem}ssimo`;
  }
}

function pickRarity(seed: number): RarityInfo {
  const total = RARITIES.reduce((sum, r) => sum + r.weight, 0);
  let roll = seed % total;
  for (const r of RARITIES) {
    if (roll < r.weight) return r;
    roll -= r.weight;
  }
  return RARITIES[0];
}

const cache = new Map<CreatureId, Creature>();

export function getCreature(id: CreatureId): Creature {
  const hit = cache.get(id);
  if (hit) return hit;
  const { animal, object } = parseCreatureId(id);
  const seed = hashString(id);
  const creature: Creature = {
    id,
    animal,
    object,
    name: makeName(animal, object, seed),
    rarity: pickRarity(Math.floor(seed / 7)),
  };
  cache.set(id, creature);
  return creature;
}

/** Every creature that exists in the game, in Rot-dex order. */
export const ALL_CREATURES: CreatureId[] = ALL_ANIMALS.flatMap((a) => ALL_OBJECTS.map((o) => creatureId(a, o)));

/** Which set a creature belongs to: the later of its animal's and its object's sets. */
export function creatureSet(id: CreatureId): SetId {
  const { animal, object } = parseCreatureId(id);
  const a = SETS.findIndex((s) => s.animals.includes(animal));
  const o = SETS.findIndex((s) => s.objects.includes(object));
  return SETS[Math.max(a, o)].id;
}

export function unlockedAnimals(sets: SetId[]): AnimalId[] {
  return SETS.filter((s) => sets.includes(s.id)).flatMap((s) => s.animals);
}

export function unlockedObjects(sets: SetId[]): ObjectId[] {
  return SETS.filter((s) => sets.includes(s.id)).flatMap((s) => s.objects);
}

export function isCreatureUnlocked(id: CreatureId, sets: SetId[]): boolean {
  const { animal, object } = parseCreatureId(id);
  return unlockedAnimals(sets).includes(animal) && unlockedObjects(sets).includes(object);
}

/** Aura per second for one creature at a given level. Merging pays more than keeping two. */
export function creatureIncome(id: CreatureId, level: number): number {
  return getCreature(id).rarity.baseIncome * Math.pow(2.5, level - 1);
}
