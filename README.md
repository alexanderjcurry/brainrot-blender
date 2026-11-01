# Brainrot Blender (prototype)

A merge-and-discover idle game for iOS and Android, built with Expo (React Native).
Blend an animal with an object to hatch an original brainrot creature, merge identical
creatures to level them up, and earn Aura every second, even while the app is closed.

Everything runs on the device. There is no server.

## Run it

```bash
npm install
npx expo start --web      # play in a browser
npx tsc --noEmit          # typecheck
npx eslint .              # lint
npx tsx scripts/simulate.ts   # bot plays 4 hours to check pacing
```

To make a single self-contained HTML file of the web build:

```bash
npx expo export --platform web --output-dir dist
node scripts/inline-web.js dist brainrot-blender.html
```

## How the code is laid out

| Path | What it holds |
| --- | --- |
| `src/game/content.ts` | All content as data: animals, objects, ingredient sets, rarity tiers |
| `src/game/creatures.ts` | Deterministic creatures: the same animal + object always gives the same name and rarity |
| `src/game/state.ts` | Game state, the reducer (every rule of the game) and economy formulas |
| `src/game/save.ts` | Saving to the device; failures fall back to no save |
| `src/components/Art.tsx` | Vector art: creatures are assembled from heads, bodies, legs and objects |
| `src/components/Board.tsx` | The 5 x 6 board with drag-and-drop and tap-to-move |
| `src/components/Screens.tsx` | Rot-dex and Upgrades screens |
| `src/components/Overlays.tsx` | Discovery reveal, welcome-back earnings, toasts, buttons |
| `App.tsx` | Screen layout, ticking, autosave and the text-to-speech narrator |

## Adding a new ingredient set

1. Add the animal(s) to `ANIMALS` and object(s) to `OBJECTS` in `content.ts`, with a made-up
   fake-Italian `word` and `stem` for names.
2. Draw the head in `Head` and the object in `ObjectShape` in `Art.tsx`.
3. Add a set to `SETS` with its price.

Rule: never use the names, looks or sounds of existing meme characters.

## Not built yet

Real ads (AdMob), in-app purchases, the under-13 age gate, share cards, Game Center and
Google Play Games, app icon and store listing, and EAS build setup.
