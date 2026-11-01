import { AnimalId, IngredientId, MAX_LEVEL, ObjectId, SETS, SetId, isAnimal } from './content';
import {
  CreatureId,
  creatureId,
  creatureIncome,
  getCreature,
  unlockedAnimals,
  unlockedObjects,
} from './creatures';
import { hashString, localDateKey } from './rng';

export const BOARD_COLS = 5;
export const BOARD_ROWS = 6;
export const BOARD_SIZE = BOARD_COLS * BOARD_ROWS;

/** Offline earnings stop after this long, so players are nudged to come back. */
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
/** Offline earnings pay this share of the live rate (a rewarded ad doubles it). */
export const OFFLINE_RATE = 0.5;

export type Cell =
  | null
  | { kind: 'ingredient'; id: IngredientId }
  | { kind: 'creature'; id: CreatureId; level: number };

export interface Upgrades {
  speed: number;
  jar: number;
}

/** Everything that is saved to the device. */
export interface SaveData {
  version: 1;
  aura: number;
  board: Cell[];
  charges: number;
  lastChargeAt: number;
  lastTickAt: number;
  upgrades: Upgrades;
  sets: SetId[];
  discovered: Partial<Record<CreatureId, number>>;
  dailyClaimed: string | null;
  voiceOn: boolean;
  stats: { fusions: number; merges: number; auraEarned: number };
}

/** Save data plus short-lived UI events that are never saved. */
export interface GameState extends SaveData {
  reveals: CreatureId[];
  toast: { id: number; text: string } | null;
  offline: { aura: number; seconds: number } | null;
}

// ---------- Economy formulas ----------

export function blendInterval(speedLevel: number): number {
  return Math.max(1500, Math.round(10000 * Math.pow(0.85, speedLevel)));
}

export function maxCharges(jarLevel: number): number {
  return 10 + 5 * jarLevel;
}

export function speedCost(level: number): number {
  return Math.round(50 * Math.pow(1.9, level));
}

export function jarCost(level: number): number {
  return Math.round(120 * Math.pow(2.4, level));
}

/** One-time Aura for discovering a creature. */
export function discoveryBonus(id: CreatureId): number {
  return getCreature(id).rarity.baseIncome * 15;
}

export function boardIncome(board: Cell[]): number {
  let total = 0;
  for (const cell of board) {
    if (cell?.kind === 'creature') total += creatureIncome(cell.id, cell.level);
  }
  return total;
}

export function sellValue(cell: Cell): number {
  if (!cell) return 0;
  if (cell.kind === 'ingredient') return 1;
  return Math.round(creatureIncome(cell.id, cell.level) * 20);
}

/** Today's secret fusion: picked from the date, so every player gets the same one. */
export function dailyBlend(now: number, sets: SetId[]): CreatureId {
  const key = localDateKey(now);
  const animals = unlockedAnimals(sets);
  const objects = unlockedObjects(sets);
  const seed = hashString(`daily:${key}`);
  return creatureId(animals[seed % animals.length], objects[Math.floor(seed / 97) % objects.length]);
}

export function dailyBonus(board: Cell[]): number {
  return Math.max(150, Math.round(boardIncome(board) * 120));
}

// ---------- State ----------

export function newGame(now: number): GameState {
  const board: Cell[] = Array(BOARD_SIZE).fill(null);
  // A friendly start: one animal and one object side by side.
  board[12] = { kind: 'ingredient', id: 'pigeon' };
  board[13] = { kind: 'ingredient', id: 'toaster' };
  return {
    version: 1,
    aura: 0,
    board,
    charges: 6,
    lastChargeAt: now,
    lastTickAt: now,
    upgrades: { speed: 0, jar: 0 },
    sets: ['starter'],
    discovered: {},
    dailyClaimed: null,
    voiceOn: true,
    stats: { fusions: 0, merges: 0, auraEarned: 0 },
    reveals: [],
    toast: null,
    offline: null,
  };
}

export function toSaveData(state: GameState): SaveData {
  const { reveals, toast, offline, ...save } = state;
  return save;
}

let toastCounter = 0;
function withToast(state: GameState, text: string): GameState {
  toastCounter += 1;
  return { ...state, toast: { id: toastCounter, text } };
}

function catchUpCharges(state: GameState, now: number): GameState {
  const interval = blendInterval(state.upgrades.speed);
  const max = maxCharges(state.upgrades.jar);
  if (state.charges >= max) {
    return state.lastChargeAt === now ? state : { ...state, lastChargeAt: now };
  }
  const gained = Math.floor((now - state.lastChargeAt) / interval);
  if (gained <= 0) return state;
  const charges = Math.min(max, state.charges + gained);
  const lastChargeAt = charges >= max ? now : state.lastChargeAt + gained * interval;
  return { ...state, charges, lastChargeAt };
}

function earn(state: GameState, amount: number): GameState {
  return {
    ...state,
    aura: state.aura + amount,
    stats: { ...state.stats, auraEarned: state.stats.auraEarned + amount },
  };
}

/** Pays offline earnings (at a reduced rate, capped) and refills the blender for the time away. */
function returnFromAway(state: GameState, now: number): GameState {
  const away = Math.min(OFFLINE_CAP_MS, Math.max(0, now - state.lastTickAt));
  const offlineAura = boardIncome(state.board) * (away / 1000) * OFFLINE_RATE;
  const next = catchUpCharges({ ...state, lastTickAt: now }, now);
  // Only greet the player when they were away long enough to notice.
  if (away >= 60_000 && offlineAura >= 1) {
    const pending = (state.offline?.aura ?? 0) + offlineAura;
    const seconds = (state.offline?.seconds ?? 0) + Math.round(away / 1000);
    return { ...next, offline: { aura: pending, seconds } };
  }
  return earn(next, offlineAura);
}

export type Action =
  | { type: 'LOAD'; save: SaveData | null; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'BLEND'; now: number; roll1: number; roll2: number; roll3: number }
  | { type: 'DROP'; from: number; to: number; now: number }
  | { type: 'SELL'; from: number }
  | { type: 'BUY_SPEED'; now: number }
  | { type: 'BUY_JAR'; now: number }
  | { type: 'UNLOCK_SET'; id: SetId }
  | { type: 'CLAIM_OFFLINE'; multiplier: number }
  | { type: 'AD_REFILL'; now: number }
  | { type: 'DISMISS_REVEAL' }
  | { type: 'DISMISS_TOAST' }
  | { type: 'TOGGLE_VOICE' }
  | { type: 'RESET'; now: number };

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOAD': {
      if (!action.save) return newGame(action.now);
      const base: GameState = { ...newGame(action.now), ...action.save, reveals: [], toast: null, offline: null };
      return returnFromAway(base, action.now);
    }

    case 'TICK': {
      const seconds = Math.max(0, action.now - state.lastTickAt) / 1000;
      // A long gap means the app was in the background: pay it as offline time.
      if (seconds > 5) return returnFromAway(state, action.now);
      const next = earn(state, boardIncome(state.board) * seconds);
      return catchUpCharges({ ...next, lastTickAt: action.now }, action.now);
    }

    case 'BLEND': {
      if (state.charges <= 0) return withToast(state, 'Blender is empty. Wait for it to recharge!');
      const empty = state.board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
      if (empty.length === 0) return withToast(state, 'Board is full! Fuse, merge or sell something.');
      const animals = unlockedAnimals(state.sets);
      const objects = unlockedObjects(state.sets);
      // Lean toward whichever kind is missing on the board, so there is usually something to fuse.
      const loose = state.board.filter((c) => c?.kind === 'ingredient') as { id: IngredientId }[];
      const looseAnimals = loose.filter((c) => isAnimal(c.id)).length;
      const animalChance = (loose.length - looseAnimals + 1) / (loose.length + 2);
      const pool: IngredientId[] = action.roll2 < animalChance ? animals : objects;
      const pick = pool[Math.min(pool.length - 1, Math.floor(action.roll3 * pool.length))];
      const cellIndex = empty[Math.floor(action.roll1 * empty.length)];
      const board = state.board.slice();
      board[cellIndex] = { kind: 'ingredient', id: pick };
      const max = maxCharges(state.upgrades.jar);
      return {
        ...state,
        board,
        charges: state.charges - 1,
        // If the jar was full, the recharge timer starts now.
        lastChargeAt: state.charges >= max ? action.now : state.lastChargeAt,
      };
    }

    case 'DROP': {
      const { from, to } = action;
      if (from === to) return state;
      const a = state.board[from];
      const b = state.board[to];
      if (!a) return state;
      const board = state.board.slice();

      // Move into an empty cell.
      if (!b) {
        board[to] = a;
        board[from] = null;
        return { ...state, board };
      }

      // Fuse an animal with an object.
      if (a.kind === 'ingredient' && b.kind === 'ingredient' && isAnimal(a.id) !== isAnimal(b.id)) {
        const animal = (isAnimal(a.id) ? a.id : b.id) as AnimalId;
        const object = (isAnimal(a.id) ? b.id : a.id) as ObjectId;
        const id = creatureId(animal, object);
        board[to] = { kind: 'creature', id, level: 1 };
        board[from] = null;
        let next: GameState = { ...state, board, stats: { ...state.stats, fusions: state.stats.fusions + 1 } };
        if (!state.discovered[id]) {
          const bonus = discoveryBonus(id);
          next = earn({ ...next, discovered: { ...next.discovered, [id]: action.now }, reveals: [...next.reveals, id] }, bonus);
        }
        const today = localDateKey(action.now);
        if (id === dailyBlend(action.now, state.sets) && state.dailyClaimed !== today) {
          const bonus = dailyBonus(state.board);
          next = withToast(earn({ ...next, dailyClaimed: today }, bonus), `Daily Blend found! +${formatAura(bonus)} Aura`);
        }
        return next;
      }

      // Merge two identical creatures.
      if (a.kind === 'creature' && b.kind === 'creature' && a.id === b.id && a.level === b.level) {
        if (a.level >= MAX_LEVEL) return withToast(state, 'Already max level!');
        board[to] = { kind: 'creature', id: a.id, level: a.level + 1 };
        board[from] = null;
        return { ...state, board, stats: { ...state.stats, merges: state.stats.merges + 1 } };
      }

      // Anything else swaps places.
      board[to] = a;
      board[from] = b;
      return { ...state, board };
    }

    case 'SELL': {
      const cell = state.board[action.from];
      if (!cell) return state;
      const board = state.board.slice();
      board[action.from] = null;
      const value = sellValue(cell);
      return withToast(earn({ ...state, board }, value), `Sold for ${formatAura(value)} Aura`);
    }

    case 'BUY_SPEED': {
      const cost = speedCost(state.upgrades.speed);
      if (state.aura < cost || blendInterval(state.upgrades.speed) <= 1500) return state;
      return { ...state, aura: state.aura - cost, upgrades: { ...state.upgrades, speed: state.upgrades.speed + 1 } };
    }

    case 'BUY_JAR': {
      const cost = jarCost(state.upgrades.jar);
      if (state.aura < cost) return state;
      return { ...state, aura: state.aura - cost, upgrades: { ...state.upgrades, jar: state.upgrades.jar + 1 } };
    }

    case 'UNLOCK_SET': {
      const set = SETS.find((s) => s.id === action.id);
      if (!set || state.sets.includes(set.id) || state.aura < set.cost) return state;
      return withToast({ ...state, aura: state.aura - set.cost, sets: [...state.sets, set.id] }, `${set.name} unlocked! New fusions await.`);
    }

    case 'CLAIM_OFFLINE': {
      if (!state.offline) return state;
      return { ...earn(state, state.offline.aura * action.multiplier), offline: null };
    }

    case 'AD_REFILL':
      return withToast(
        { ...state, charges: maxCharges(state.upgrades.jar), lastChargeAt: action.now },
        'Blender refilled!',
      );

    case 'DISMISS_REVEAL':
      return { ...state, reveals: state.reveals.slice(1) };

    case 'DISMISS_TOAST':
      return { ...state, toast: null };

    case 'TOGGLE_VOICE':
      return { ...state, voiceOn: !state.voiceOn };

    case 'RESET':
      return newGame(action.now);
  }
}

export function formatAura(value: number): string {
  if (value < 1000) return value < 10 ? value.toFixed(1).replace(/\.0$/, '') : Math.floor(value).toString();
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let v = value;
  let u = -1;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u += 1;
  }
  return `${v < 100 ? v.toFixed(1) : Math.floor(v)}${units[u]}`;
}
