import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DiscoveryOverlay, OfflineOverlay, Toast } from './src/components/Overlays';
import { RotDex, Shop } from './src/components/Screens';
import { colors } from './src/components/theme';
import { BoardScene } from './src/three/BoardScene';
import { ANIMALS } from './src/game/content';
import { CreatureId, getCreature, parseCreatureId } from './src/game/creatures';
import { localDateKey } from './src/game/rng';
import { loadGame, saveGame } from './src/game/save';
import {
  blendInterval,
  boardIncome,
  dailyBlend,
  dailyBonus,
  formatAura,
  maxCharges,
  newGame,
  reducer,
  toSaveData,
} from './src/game/state';

type Tab = 'board' | 'dex' | 'shop';

function speakName(id: CreatureId) {
  Speech.stop();
  // A flat, slightly slow Italian voice is the classic brainrot narrator.
  Speech.speak(getCreature(id).name, { language: 'it-IT', rate: 0.9, pitch: 0.95 });
}

export default function App() {
  // Starts as a blank game; the saved game (or a fresh one) is loaded right after mount.
  const [state, dispatch] = useReducer(reducer, 0, newGame);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('board');
  const [selected, setSelected] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [blendCount, setBlendCount] = useState(0);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  // Load the save once, then tick every second.
  useEffect(() => {
    loadGame().then((save) => {
      dispatch({ type: 'LOAD', save, now: Date.now() });
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const tick = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 1000);
    const clock = setInterval(() => setNow(Date.now()), 250);
    const autosave = setInterval(() => saveGame(toSaveData(latest.current)), 4000);
    // Save when the app goes to the background. Time away is paid out by the next tick.
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') saveGame(toSaveData(latest.current));
    });
    return () => {
      clearInterval(tick);
      clearInterval(clock);
      clearInterval(autosave);
      sub.remove();
    };
  }, [loaded]);

  // Phone browsers (Safari especially) only let a page talk after a touch.
  // Speak a silent word on the first touch so the narrator works from then on.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const events = ['pointerup', 'touchend', 'click'] as const;
    function unlock() {
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
      events.forEach((type) => window.removeEventListener(type, unlock, true));
    }
    events.forEach((type) => window.addEventListener(type, unlock, true));
    return () => events.forEach((type) => window.removeEventListener(type, unlock, true));
  }, []);

  // Read each new discovery out loud.
  const reveal = state.reveals[0];
  useEffect(() => {
    if (reveal && state.voiceOn) speakName(reveal);
    if (reveal) saveGame(toSaveData(latest.current));
  }, [reveal, state.voiceOn]);

  const onDrop = useCallback((from: number, to: number) => dispatch({ type: 'DROP', from, to, now: Date.now() }), []);
  const onSell = useCallback((from: number) => dispatch({ type: 'SELL', from }), []);
  const dismissToast = useCallback(() => dispatch({ type: 'DISMISS_TOAST' }), []);

  const income = boardIncome(state.board);
  const max = maxCharges(state.upgrades.jar);
  const interval = blendInterval(state.upgrades.speed);
  const progress = state.charges >= max ? 1 : Math.min(1, Math.max(0, (now - state.lastChargeAt) / interval));
  const daily = dailyBlend(now, state.sets);
  const dailyDone = state.dailyClaimed === localDateKey(now);
  const dailyAnimal = ANIMALS[parseCreatureId(daily).animal];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.app}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BRAINROT BLENDER</Text>
            <Text style={styles.aura}>{formatAura(state.aura)} Aura</Text>
          </View>
          <View style={styles.rate}>
            <Text style={styles.rateText}>+{formatAura(income)}/s</Text>
          </View>
        </View>

        {tab === 'board' && (
          <View style={styles.boardArea}>
            <View style={styles.daily}>
              {dailyDone ? (
                <Text style={styles.dailyText}>Daily Blend found! A new secret drops tomorrow.</Text>
              ) : (
                <Text style={styles.dailyText}>
                  <Text style={styles.dailyStrong}>Daily Blend: </Text>
                  {dailyAnimal.label} + something secret. Find it for +{formatAura(dailyBonus(state.board))} Aura
                </Text>
              )}
            </View>

            <BoardScene
              board={state.board}
              selected={selected}
              blendCount={blendCount}
              onSelect={setSelected}
              onDrop={onDrop}
              onSell={onSell}
            />

            <View style={styles.controls}>
              <Pressable
                testID="sell-button"
                onPress={() => {
                  if (selected !== null) {
                    onSell(selected);
                    setSelected(null);
                  }
                }}
                style={[styles.sell, selected !== null && styles.sellActive]}
              >
                <Text style={styles.sellText}>SELL</Text>
                <Text style={styles.sellHint}>{selected !== null ? 'selected' : 'or drag to red'}</Text>
              </Pressable>

              <Pressable
                testID="blend-button"
                onPress={() => {
                  if (state.charges > 0 && state.board.some((c) => !c)) setBlendCount((n) => n + 1);
                  dispatch({ type: 'BLEND', now: Date.now(), roll1: Math.random(), roll2: Math.random(), roll3: Math.random() });
                }}
                style={({ pressed }) => [styles.blender, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <Text style={styles.blenderText}>BLEND</Text>
                <Text style={styles.blenderCount}>
                  {state.charges}/{max}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
              </Pressable>

              <Pressable testID="refill-button" onPress={() => dispatch({ type: 'AD_REFILL', now: Date.now() })} style={styles.adButton}>
                <Text style={styles.adText}>REFILL</Text>
                <Text style={styles.adHint}>watch ad</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>
              {state.stats.fusions === 0
                ? 'Drag the pigeon onto the toaster to blend your first brainrot!'
                : selected !== null
                  ? 'Now tap where it should go, or tap SELL.'
                  : 'Animal + object = new brainrot. Two identical brainrots = level up.'}
            </Text>
          </View>
        )}

        {tab === 'dex' && <RotDex state={state} onSpeak={speakName} />}
        {tab === 'shop' && (
          <Shop
            state={state}
            onBuySpeed={() => dispatch({ type: 'BUY_SPEED', now: Date.now() })}
            onBuyJar={() => dispatch({ type: 'BUY_JAR', now: Date.now() })}
            onUnlock={(id) => dispatch({ type: 'UNLOCK_SET', id })}
            onToggleVoice={() => dispatch({ type: 'TOGGLE_VOICE' })}
            onReset={() => {
              dispatch({ type: 'RESET', now: Date.now() });
              setTab('board');
            }}
          />
        )}

        <View style={styles.tabs}>
          {(
            [
              ['board', 'Blend'],
              ['dex', 'Rot-dex'],
              ['shop', 'Upgrades'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <Pressable key={id} testID={`tab-${id}`} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabActive]}>
              <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {state.toast && <Toast key={state.toast.id} text={state.toast.text} onDone={dismissToast} />}
        {state.offline && (
          <OfflineOverlay
            aura={state.offline.aura}
            seconds={state.offline.seconds}
            onClaim={(multiplier) => dispatch({ type: 'CLAIM_OFFLINE', multiplier })}
          />
        )}
        {reveal && !state.offline && (
          <DiscoveryOverlay id={reveal} onSpeak={() => speakName(reveal)} onClose={() => dispatch({ type: 'DISMISS_REVEAL' })} />
        )}
        {!loaded && (
          <View style={styles.loading}>
            <Text style={styles.brand}>BRAINROT BLENDER</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0818',
    alignItems: 'center',
  },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'web' ? 12 : 52,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  brand: {
    color: colors.pink,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 12,
  },
  aura: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 30,
  },
  rate: {
    backgroundColor: colors.panel,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.lime,
  },
  rateText: {
    color: colors.lime,
    fontWeight: '900',
    fontSize: 16,
  },
  boardArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  daily: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  dailyText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
  },
  dailyStrong: {
    color: colors.gold,
    fontWeight: '900',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  sell: {
    width: 78,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.25)',
  },
  sellText: {
    color: colors.danger,
    fontWeight: '900',
  },
  sellHint: {
    color: colors.muted,
    fontSize: 11,
  },
  blender: {
    flex: 1,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  blenderText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 2,
  },
  blenderCount: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 13,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(20, 15, 42, 0.25)',
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.ink,
  },
  adButton: {
    width: 78,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adText: {
    color: colors.ink,
    fontWeight: '900',
  },
  adHint: {
    color: colors.ink,
    fontSize: 11,
  },
  hint: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.panelBorder,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 6,
    paddingHorizontal: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: colors.panel,
  },
  tabText: {
    color: colors.muted,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.lime,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
