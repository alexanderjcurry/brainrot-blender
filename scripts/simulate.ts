// Plays the game with a simple greedy bot to check pacing and catch logic bugs.
// Run: npx tsx scripts/simulate.ts
import { isAnimal } from '../src/game/content';
import { ALL_CREATURES } from '../src/game/creatures';
import { GameState, jarCost, newGame, reducer, speedCost, Action } from '../src/game/state';

let now = Date.UTC(2026, 10, 1, 12);
let s: GameState = newGame(now);
const act = (a: Action) => (s = reducer(s, a));
const milestones: string[] = [];
const seen = new Set<string>();
const mark = (label: string) => {
  if (!seen.has(label)) {
    seen.add(label);
    milestones.push(`${(Math.round((now - Date.UTC(2026, 10, 1, 12)) / 6000) / 10).toFixed(1)} min: ${label}`);
  }
};

function step() {
  // Fuse any animal with any object.
  for (let i = 0; i < s.board.length; i++) {
    const a = s.board[i];
    if (a?.kind !== 'ingredient') continue;
    const j = s.board.findIndex((b, k) => k !== i && b?.kind === 'ingredient' && isAnimal(b.id) !== isAnimal(a.id));
    if (j >= 0) return act({ type: 'DROP', from: i, to: j, now });
  }
  // Merge identical creatures.
  for (let i = 0; i < s.board.length; i++) {
    const a = s.board[i];
    if (a?.kind !== 'creature') continue;
    const j = s.board.findIndex((b, k) => k !== i && b?.kind === 'creature' && b.id === a.id && b.level === a.level);
    if (j >= 0) return act({ type: 'DROP', from: i, to: j, now });
  }
  // Buy things.
  if (!s.sets.includes('weirdPets') && s.aura >= 2500) return act({ type: 'UNLOCK_SET', id: 'weirdPets' });
  if (!s.sets.includes('chaos') && s.aura >= 250000) return act({ type: 'UNLOCK_SET', id: 'chaos' });
  if (s.aura >= speedCost(s.upgrades.speed) * 3) return act({ type: 'BUY_SPEED', now });
  if (s.aura >= jarCost(s.upgrades.jar) * 3) return act({ type: 'BUY_JAR', now });
  // Blend, or sell the weakest creature if the board is full.
  if (s.charges > 0) {
    if (s.board.every((c) => c)) {
      const weakest = s.board.findIndex((c) => c?.kind === 'creature' && c.level === 1);
      if (weakest >= 0) act({ type: 'SELL', from: weakest });
    }
    return act({ type: 'BLEND', now, roll1: Math.random(), roll2: Math.random(), roll3: Math.random() });
  }
}

for (let t = 0; t < 4 * 3600; t++) {
  now += 1000;
  act({ type: 'TICK', now });
  for (let k = 0; k < 3; k++) step();
  const found = Object.keys(s.discovered).length;
  if (found >= 9) mark('all 9 starter creatures found');
  if (s.sets.includes('weirdPets')) mark('Weird Pets unlocked');
  if (s.sets.includes('chaos')) mark('Total Chaos unlocked');
  if (found >= 32) mark('half the Rot-dex found');
  if (found >= ALL_CREATURES.length) mark('Rot-dex complete');
  const maxLevel = Math.max(0, ...s.board.map((c) => (c?.kind === 'creature' ? c.level : 0)));
  if (maxLevel >= 4) mark('first level 4 creature');
  if (maxLevel >= 6) mark('first level 6 creature');
  if (s.board.length !== 30 || Number.isNaN(s.aura)) throw new Error('broken state');
}
console.log(milestones.join('\n'));
console.log(`after 4h: ${Object.keys(s.discovered).length} found, speed ${s.upgrades.speed}, jar ${s.upgrades.jar}, aura ${Math.round(s.aura)}`);
