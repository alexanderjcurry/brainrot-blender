// All game content lives here as plain data, so new creature sets can be
// added without touching game logic. Every creature is original: we never use
// names, looks or sounds of existing meme characters.

export type AnimalId =
  | 'pigeon'
  | 'capybara'
  | 'hamster'
  | 'octopus'
  | 'snail'
  | 'raccoon'
  | 'goat'
  | 'penguin';

export type ObjectId =
  | 'toaster'
  | 'cone'
  | 'phone'
  | 'microwave'
  | 'umbrella'
  | 'donut'
  | 'chair'
  | 'tuba';

export type IngredientId = AnimalId | ObjectId;

export type LegStyle = 'bird' | 'paws' | 'hooves' | 'tentacles' | 'slime';

export interface Animal {
  kind: 'animal';
  id: AnimalId;
  label: string;
  /** Fake-Italian word used in creature names. */
  word: string;
  /** Short stem used for rhymes and repeats. */
  stem: string;
  color: string;
  accent: string;
  legs: LegStyle;
}

/** How an object attaches to the creature. */
/** body: replaces the body. hat: sits on the head. base: the creature sits on it. wrap: worn around the body. */
export type ObjectMount = 'body' | 'hat' | 'base' | 'wrap';

export interface GameObject {
  kind: 'object';
  id: ObjectId;
  label: string;
  word: string;
  stem: string;
  mount: ObjectMount;
}

export type Ingredient = Animal | GameObject;

export const ANIMALS: Record<AnimalId, Animal> = {
  pigeon: { kind: 'animal', id: 'pigeon', label: 'Pigeon', word: 'Piccione', stem: 'Picci', color: '#9AA5B1', accent: '#6FBF8E', legs: 'bird' },
  capybara: { kind: 'animal', id: 'capybara', label: 'Capybara', word: 'Capibara', stem: 'Capi', color: '#A9774B', accent: '#7A5232', legs: 'paws' },
  hamster: { kind: 'animal', id: 'hamster', label: 'Hamster', word: 'Criceto', stem: 'Crice', color: '#E9A15B', accent: '#FFF3E0', legs: 'paws' },
  octopus: { kind: 'animal', id: 'octopus', label: 'Octopus', word: 'Polpo', stem: 'Polpi', color: '#B565D8', accent: '#E3B5F5', legs: 'tentacles' },
  snail: { kind: 'animal', id: 'snail', label: 'Snail', word: 'Lumaca', stem: 'Luma', color: '#B8C96A', accent: '#C58B4E', legs: 'slime' },
  raccoon: { kind: 'animal', id: 'raccoon', label: 'Raccoon', word: 'Procione', stem: 'Proci', color: '#8E8E99', accent: '#2E2E38', legs: 'paws' },
  goat: { kind: 'animal', id: 'goat', label: 'Goat', word: 'Capra', stem: 'Capri', color: '#F2EEE6', accent: '#C9B79C', legs: 'hooves' },
  penguin: { kind: 'animal', id: 'penguin', label: 'Penguin', word: 'Pinguino', stem: 'Pinghi', color: '#2B2F3A', accent: '#F5F5F5', legs: 'bird' },
};

export const OBJECTS: Record<ObjectId, GameObject> = {
  toaster: { kind: 'object', id: 'toaster', label: 'Toaster', word: 'Tostino', stem: 'Tosti', mount: 'body' },
  cone: { kind: 'object', id: 'cone', label: 'Traffic cone', word: 'Conetto', stem: 'Coni', mount: 'hat' },
  phone: { kind: 'object', id: 'phone', label: 'Phone', word: 'Telefonino', stem: 'Telefo', mount: 'body' },
  microwave: { kind: 'object', id: 'microwave', label: 'Microwave', word: 'Microondo', stem: 'Micro', mount: 'body' },
  umbrella: { kind: 'object', id: 'umbrella', label: 'Umbrella', word: 'Ombrellino', stem: 'Ombre', mount: 'hat' },
  donut: { kind: 'object', id: 'donut', label: 'Donut', word: 'Ciambella', stem: 'Ciamba', mount: 'wrap' },
  chair: { kind: 'object', id: 'chair', label: 'Office chair', word: 'Sedione', stem: 'Sedi', mount: 'base' },
  tuba: { kind: 'object', id: 'tuba', label: 'Tuba', word: 'Tubone', stem: 'Tuba', mount: 'wrap' },
};

export function getIngredient(id: IngredientId): Ingredient {
  return (ANIMALS as Record<string, Ingredient>)[id] ?? (OBJECTS as Record<string, Ingredient>)[id];
}

export function isAnimal(id: IngredientId): id is AnimalId {
  return id in ANIMALS;
}

// Ingredient sets unlock over time. Each set adds animals and objects, which
// multiplies the number of possible fusions.
export type SetId = 'starter' | 'weirdPets' | 'chaos';

export interface IngredientSet {
  id: SetId;
  name: string;
  blurb: string;
  cost: number;
  animals: AnimalId[];
  objects: ObjectId[];
}

export const SETS: IngredientSet[] = [
  { id: 'starter', name: 'Starter Blend', blurb: 'Where it all begins.', cost: 0, animals: ['pigeon', 'capybara', 'hamster'], objects: ['toaster', 'cone', 'phone'] },
  { id: 'weirdPets', name: 'Weird Pets', blurb: 'Adds Octopus, Snail, Microwave and Umbrella.', cost: 2500, animals: ['octopus', 'snail'], objects: ['microwave', 'umbrella'] },
  { id: 'chaos', name: 'Total Chaos', blurb: 'Adds Raccoon, Goat, Penguin, Donut, Office chair and Tuba.', cost: 250000, animals: ['raccoon', 'goat', 'penguin'], objects: ['donut', 'chair', 'tuba'] },
];

export const ALL_ANIMALS = Object.keys(ANIMALS) as AnimalId[];
export const ALL_OBJECTS = Object.keys(OBJECTS) as ObjectId[];

// Rarity tiers use our own slang names.
export type Rarity = 'mid' | 'valid' | 'goated' | 'unhinged' | 'cosmic';

export interface RarityInfo {
  id: Rarity;
  label: string;
  color: string;
  /** Aura per second at level 1. */
  baseIncome: number;
  /** Share of creatures in this tier, out of 100. */
  weight: number;
}

export const RARITIES: RarityInfo[] = [
  { id: 'mid', label: 'Mid', color: '#9CA3AF', baseIncome: 1, weight: 48 },
  { id: 'valid', label: 'Valid', color: '#34D399', baseIncome: 2, weight: 26 },
  { id: 'goated', label: 'Goated', color: '#60A5FA', baseIncome: 4, weight: 15 },
  { id: 'unhinged', label: 'Unhinged', color: '#C084FC', baseIncome: 9, weight: 8 },
  { id: 'cosmic', label: 'Cosmic', color: '#FBBF24', baseIncome: 25, weight: 3 },
];

export const MAX_LEVEL = 8;
