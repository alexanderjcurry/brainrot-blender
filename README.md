# Brainrot Blender (prototype)

A 3D merge-and-discover idle game for iOS and Android, built with Expo (React Native)
and three.js (through React Three Fiber).
Blend an animal with an object to hatch an original brainrot creature, merge identical
creatures to level them up, and earn Aura every second, even while the app is closed.

Everything runs on the device. There is no server.

## Play it on your phone with Expo Go (Windows or Mac)

1. Install **Node.js LTS** from https://nodejs.org (the default options are fine).
2. Unzip this project somewhere, for example in Documents.
3. Open the unzipped folder in File Explorer, click the address bar, type `cmd` and press
   Enter. A Command Prompt opens in that folder. (Use Command Prompt rather than
   PowerShell, which can block `npx`.)
4. Run `npm install` and wait for it to finish (a minute or two the first time).
5. Run `npx expo start`. A QR code appears.
6. Scan it: on iPhone with the Camera app, on Android from inside the Expo Go app.
   Phone and computer must be on the same Wi-Fi. If Windows asks whether Node.js may use
   the network, allow it.
7. Change a file and save: the game reloads on your phone.

If the phone can't connect, stop with Ctrl+C and run `npx expo start --tunnel` instead.
If Expo Go says the project's SDK isn't supported, update Expo Go from the app store
(this project uses Expo SDK 58).

## Run it

```bash
npm install
npx expo start            # QR code for Expo Go on a phone
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
| `src/three/kit.ts` | A tiny toy kit: builds models from spheres, boxes and tubes with colours, merged into one mesh |
| `src/three/models.ts` | Every 3D model: 8 animal heads, 8 objects, and how they combine into 64 creatures |
| `src/three/BoardScene.tsx` | The 3D board: drag-and-drop, tap-to-move, blender, sell pad, effects and camera |
| `src/three/CreatureViewer.tsx` | The spinning creature on a pedestal used by the reveal and the Rot-dex |
| `src/three/fit.ts` | Camera framing that fits any screen shape |
| `src/components/Screens.tsx` | Rot-dex and Upgrades screens |
| `src/components/Overlays.tsx` | Discovery reveal, welcome-back earnings, toasts, buttons |
| `App.tsx` | Screen layout, ticking, autosave and the text-to-speech narrator |

## Adding a new ingredient set

1. Add the animal(s) to `ANIMALS` and object(s) to `OBJECTS` in `content.ts`, with a made-up
   fake-Italian `word` and `stem` for names.
2. Build the head in `head()` and the object in `object()` in `src/three/models.ts`.
3. Add a set to `SETS` with its price.

Rule: never use the names, looks or sounds of existing meme characters.

## Tested so far

Played in desktop and phone-sized browsers with mouse and touch (fuse, voice, blend,
tap-to-move, sell, merge, offline earnings, saving). The iOS and Android bundles compile,
but it has not run on a real phone yet: the first Expo Go run is that test.

## Not built yet

Real ads (AdMob), in-app purchases, the under-13 age gate, share cards, Game Center and
Google Play Games, app icon and store listing, and EAS build setup.
