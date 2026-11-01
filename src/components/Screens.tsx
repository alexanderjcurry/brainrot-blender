import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SETS } from '../game/content';
import { ALL_CREATURES, CreatureId, creatureIncome, creatureSet, getCreature } from '../game/creatures';
import {
  GameState,
  blendInterval,
  formatAura,
  jarCost,
  maxCharges,
  speedCost,
} from '../game/state';
import { CreatureViewer } from '../three/CreatureViewer';
import { Button } from './Overlays';
import { colors } from './theme';

export function RotDex({ state, onSpeak }: { state: GameState; onSpeak: (id: CreatureId) => void }) {
  const found = ALL_CREATURES.filter((id) => state.discovered[id]);
  const newest = [...found].sort((a, b) => (state.discovered[b] ?? 0) - (state.discovered[a] ?? 0))[0];
  const [picked, setPicked] = useState<CreatureId | null>(null);
  const shown = picked ?? newest ?? ALL_CREATURES[0];
  const shownKnown = !!state.discovered[shown];
  const c = getCreature(shown);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Rot-dex</Text>
      <Text style={styles.subtitle}>
        {found.length} of {ALL_CREATURES.length} brainrots discovered. Tap one to see it and hear its name.
      </Text>
      <View style={[styles.viewerCard, { borderColor: shownKnown ? c.rarity.color : colors.panelBorder }]}>
        <CreatureViewer id={shown} size={230} hidden={!shownKnown} />
        <Text style={styles.viewerName}>{shownKnown ? c.name : '???'}</Text>
        <Text style={[styles.dexRarity, { color: shownKnown ? c.rarity.color : colors.muted }]}>
          {shownKnown ? `${c.rarity.label} · ${formatAura(creatureIncome(shown, 1))} Aura/sec` : 'Not discovered yet'}
        </Text>
      </View>
      {SETS.map((set) => {
        const ids = ALL_CREATURES.filter((id) => creatureSet(id) === set.id);
        const owned = state.sets.includes(set.id);
        const setFound = ids.filter((id) => state.discovered[id]).length;
        return (
          <View key={set.id} style={styles.dexSection}>
            <Text style={styles.section}>
              {set.name} · {setFound}/{ids.length}
            </Text>
            {!owned && <Text style={styles.lockedNote}>Unlock this set in Upgrades to find these.</Text>}
            <View style={[styles.dexGrid, !owned && { opacity: 0.45 }]}>
              {ids.map((id) => {
                const cr = getCreature(id);
                const known = !!state.discovered[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      setPicked(id);
                      if (known) onSpeak(id);
                    }}
                    style={[
                      styles.dexChip,
                      { borderColor: id === shown ? colors.lime : known ? cr.rarity.color : colors.panelBorder },
                    ]}
                  >
                    <View style={[styles.dexDot, { backgroundColor: known ? cr.rarity.color : colors.panelBorder }]} />
                    <Text style={[styles.dexName, !known && { color: colors.muted }]} numberOfLines={1}>
                      {known ? cr.name : '???'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function ShopRow({
  title,
  detail,
  cost,
  canAfford,
  maxed,
  onBuy,
}: {
  title: string;
  detail: string;
  cost: number;
  canAfford: boolean;
  maxed?: boolean;
  onBuy: () => void;
}) {
  return (
    <View style={styles.shopRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.shopTitle}>{title}</Text>
        <Text style={styles.shopDetail}>{detail}</Text>
      </View>
      {maxed ? (
        <Text style={styles.maxed}>MAXED</Text>
      ) : (
        <Button small label={`${formatAura(cost)} Aura`} disabled={!canAfford} onPress={onBuy} />
      )}
    </View>
  );
}

export function Shop({
  state,
  onBuySpeed,
  onBuyJar,
  onUnlock,
  onToggleVoice,
  onReset,
}: {
  state: GameState;
  onBuySpeed: () => void;
  onBuyJar: () => void;
  onUnlock: (id: (typeof SETS)[number]['id']) => void;
  onToggleVoice: () => void;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const speedNow = blendInterval(state.upgrades.speed);
  const speedNext = blendInterval(state.upgrades.speed + 1);
  const jarNow = maxCharges(state.upgrades.jar);
  const jarNext = maxCharges(state.upgrades.jar + 1);
  const sCost = speedCost(state.upgrades.speed);
  const jCost = jarCost(state.upgrades.jar);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Upgrades</Text>
      <Text style={styles.subtitle}>You have {formatAura(state.aura)} Aura.</Text>

      <ShopRow
        title="Turbo blender"
        detail={`Recharges every ${(speedNow / 1000).toFixed(1)}s → ${(speedNext / 1000).toFixed(1)}s`}
        cost={sCost}
        canAfford={state.aura >= sCost}
        maxed={speedNow <= 1500}
        onBuy={onBuySpeed}
      />
      <ShopRow
        title="Bigger jar"
        detail={`Stores ${jarNow} → ${jarNext} blends`}
        cost={jCost}
        canAfford={state.aura >= jCost}
        onBuy={onBuyJar}
      />

      <Text style={styles.section}>Ingredient sets</Text>
      {SETS.filter((s) => s.cost > 0).map((set) =>
        state.sets.includes(set.id) ? (
          <View key={set.id} style={styles.shopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopTitle}>{set.name}</Text>
              <Text style={styles.shopDetail}>{set.blurb}</Text>
            </View>
            <Text style={styles.maxed}>OWNED</Text>
          </View>
        ) : (
          <ShopRow
            key={set.id}
            title={set.name}
            detail={set.blurb}
            cost={set.cost}
            canAfford={state.aura >= set.cost}
            onBuy={() => onUnlock(set.id)}
          />
        ),
      )}

      <Text style={styles.section}>Settings</Text>
      <View style={styles.shopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.shopTitle}>Narrator voice</Text>
          <Text style={styles.shopDetail}>{"Reads every new brainrot's name out loud."}</Text>
        </View>
        <Button small kind="secondary" label={state.voiceOn ? 'On' : 'Off'} onPress={onToggleVoice} />
      </View>
      <View style={styles.shopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.shopTitle}>Start over</Text>
          <Text style={styles.shopDetail}>Wipes your board, Aura and Rot-dex.</Text>
        </View>
        <Button
          small
          kind="secondary"
          label={confirmReset ? 'Tap again' : 'Reset'}
          onPress={() => {
            if (confirmReset) {
              setConfirmReset(false);
              onReset();
            } else {
              setConfirmReset(true);
            }
          }}
        />
      </View>
      <Text style={styles.footnote}>
        Prototype build. Ads and purchases are not connected yet. Fusions made: {state.stats.fusions}, merges:{' '}
        {state.stats.merges}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 14,
  },
  section: {
    color: colors.lime,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  dexSection: {
    marginBottom: 6,
  },
  lockedNote: {
    color: colors.muted,
    marginBottom: 8,
    fontSize: 13,
  },
  dexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dexChip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  dexDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dexName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  dexRarity: {
    fontSize: 13,
    fontWeight: '700',
  },
  viewerCard: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 20,
    borderWidth: 2,
    paddingBottom: 14,
    marginBottom: 6,
  },
  viewerName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  shopTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  shopDetail: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 13,
  },
  maxed: {
    color: colors.lime,
    fontWeight: '900',
  },
  footnote: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
});
