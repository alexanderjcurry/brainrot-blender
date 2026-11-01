import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { CreatureId, creatureIncome, getCreature } from '../game/creatures';
import { discoveryBonus, formatAura } from '../game/state';
import { CreatureArt } from './Art';
import { colors } from './theme';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled = false,
  small = false,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ad';
  disabled?: boolean;
  small?: boolean;
}) {
  const bg = kind === 'primary' ? colors.lime : kind === 'ad' ? colors.gold : 'transparent';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        kind === 'secondary' && styles.buttonSecondary,
      ]}
    >
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, kind === 'secondary' && { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function DiscoveryOverlay({ id, onSpeak, onClose }: { id: CreatureId; onSpeak: () => void; onClose: () => void }) {
  const c = getCreature(id);
  const [scale] = useState(() => new Animated.Value(0.3));
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    scale.setValue(0.3);
    spin.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: false }),
      Animated.timing(spin, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]).start();
  }, [id, scale, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] });

  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { borderColor: c.rarity.color }]}>
        <Text style={styles.kicker}>NEW BRAINROT DISCOVERED</Text>
        <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
          <CreatureArt id={id} size={210} />
        </Animated.View>
        <Text style={styles.name}>{c.name}</Text>
        <View style={[styles.pill, { backgroundColor: c.rarity.color }]}>
          <Text style={styles.pillText}>{c.rarity.label.toUpperCase()}</Text>
        </View>
        <Text style={styles.detail}>
          Farms {formatAura(creatureIncome(id, 1))} Aura/sec · Discovery bonus +{formatAura(discoveryBonus(id))}
        </Text>
        <View style={styles.row}>
          <Button label="Say it again" kind="secondary" onPress={onSpeak} />
          <Button label="Let's go" onPress={onClose} />
        </View>
      </View>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function OfflineOverlay({
  aura,
  seconds,
  onClaim,
}: {
  aura: number;
  seconds: number;
  onClaim: (multiplier: number) => void;
}) {
  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { borderColor: colors.gold }]}>
        <Text style={styles.kicker}>WELCOME BACK</Text>
        <Text style={styles.detail}>While you were gone for {formatDuration(seconds)}, your rots farmed</Text>
        <Text style={styles.bigNumber}>{formatAura(aura)} Aura</Text>
        <View style={styles.column}>
          <Button label={`Watch ad: collect ${formatAura(aura * 2)}`} kind="ad" onPress={() => onClaim(2)} />
          <Button label="Collect" kind="secondary" onPress={() => onClaim(1)} />
        </View>
        <Text style={styles.footnote}>Prototype: the ad button is pretend and plays no ad.</Text>
      </View>
    </View>
  );
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    fade.setValue(0);
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 150, useNativeDriver: false }),
      Animated.delay(1800),
      Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start(({ finished }) => finished && onDone());
  }, [text, fade, onDone]);
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity: fade }]}>
      <Text style={styles.toastText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 5, 20, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.panel,
    borderRadius: 24,
    borderWidth: 3,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  kicker: {
    color: colors.lime,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontSize: 13,
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  detail: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 14,
  },
  bigNumber: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: '900',
  },
  footnote: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  column: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 6,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonSecondary: {
    borderWidth: 2,
    borderColor: colors.panelBorder,
  },
  buttonText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 15,
  },
  buttonTextSmall: {
    fontSize: 13,
  },
  toast: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: colors.lime,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 200,
    alignItems: 'center',
  },
  toastText: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
});
