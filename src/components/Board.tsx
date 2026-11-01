import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { getCreature } from '../game/creatures';
import { BOARD_COLS, BOARD_SIZE, Cell } from '../game/state';
import { CreatureArt, IngredientArt } from './Art';
import { colors } from './theme';

type HostView = React.ComponentRef<typeof View>;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  board: Cell[];
  selected: number | null;
  onSelect: (index: number | null) => void;
  onDrop: (from: number, to: number) => void;
  onSell: (from: number) => void;
  /** Rendered under the board; receives a ref for the sell bin so drags can hit it. */
  renderControls: (sellRef: React.RefObject<HostView | null>, sellActive: boolean) => React.ReactNode;
}

const GAP = 6;

function measure(view: HostView | null): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!view) return resolve(null);
    view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}

function inside(r: Rect | null, x: number, y: number): boolean {
  return !!r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

export function Board({ board, selected, onSelect, onDrop, onSell, renderControls }: Props) {
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [hover, setHover] = useState<number | 'sell' | null>(null);
  const gridRef = useRef<HostView>(null);
  const sellRef = useRef<HostView>(null);
  const rects = useRef<{ grid: Rect | null; sell: Rect | null }>({ grid: null, sell: null });

  const cellSize = width > 0 ? (width - GAP * (BOARD_COLS - 1)) / BOARD_COLS : 0;

  const remeasure = useCallback(async () => {
    rects.current = { grid: await measure(gridRef.current), sell: await measure(sellRef.current) };
  }, []);

  const targetAt = useCallback(
    (x: number, y: number): number | 'sell' | null => {
      const { grid, sell } = rects.current;
      if (inside(sell, x, y)) return 'sell';
      if (!grid || !inside(grid, x, y)) return null;
      const step = cellSize + GAP;
      const col = Math.floor((x - grid.x) / step);
      const row = Math.floor((y - grid.y) / step);
      const index = row * BOARD_COLS + col;
      return col >= 0 && col < BOARD_COLS && index >= 0 && index < BOARD_SIZE ? index : null;
    },
    [cellSize],
  );

  const handleTap = useCallback(
    (index: number) => {
      if (selected === null) {
        if (board[index]) onSelect(index);
        return;
      }
      if (selected === index) return onSelect(null);
      onDrop(selected, index);
      onSelect(null);
    },
    [board, selected, onDrop, onSelect],
  );

  const endDrag = useCallback(() => {
    setDragging(null);
    setHover(null);
  }, []);

  const handleRelease = useCallback(
    (from: number, x: number, y: number) => {
      const target = targetAt(x, y);
      endDrag();
      if (target === 'sell') onSell(from);
      else if (target !== null) onDrop(from, target);
      onSelect(null);
    },
    [targetAt, endDrag, onDrop, onSell, onSelect],
  );

  return (
    <View>
      <View
        ref={gridRef}
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width);
          remeasure();
        }}
        style={styles.grid}
      >
        {width > 0 &&
          board.map((cell, index) => (
            <View
              key={index}
              testID={`cell-${index}`}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  marginRight: index % BOARD_COLS === BOARD_COLS - 1 ? 0 : GAP,
                  marginBottom: GAP,
                  zIndex: dragging === index ? 10 : 1,
                },
                hover === index && styles.cellHover,
              ]}
            >
              {cell ? (
                <Tile
                  cell={cell}
                  index={index}
                  size={cellSize}
                  selected={selected === index}
                  onGrab={(i) => {
                    remeasure();
                    setDragging(i);
                  }}
                  onMove={(x, y) => setHover(targetAt(x, y))}
                  onTap={handleTap}
                  onCancel={endDrag}
                  onRelease={handleRelease}
                />
              ) : (
                <Pressable style={StyleSheet.absoluteFill} onPress={() => handleTap(index)} />
              )}
            </View>
          ))}
      </View>
      {renderControls(sellRef, hover === 'sell')}
    </View>
  );
}

interface TileProps {
  cell: NonNullable<Cell>;
  index: number;
  size: number;
  selected: boolean;
  onGrab: (index: number) => void;
  onMove: (x: number, y: number) => void;
  onTap: (index: number) => void;
  onCancel: () => void;
  onRelease: (index: number, x: number, y: number) => void;
}

const Tile = memo(function Tile({ cell, index, size, selected, onGrab, onMove, onTap, onCancel, onRelease }: TileProps) {
  const [pan] = useState(() => new Animated.ValueXY());
  const [pop] = useState(() => new Animated.Value(0.6));
  // Keep the latest callbacks without rebuilding the gesture handler.
  const handlers = useRef({ onGrab, onMove, onTap, onCancel, onRelease });
  useEffect(() => {
    handlers.current = { onGrab, onMove, onTap, onCancel, onRelease };
  });

  // Pop in whenever the tile's content changes (spawn, fusion, merge).
  const contentKey = cell.kind === 'creature' ? `${cell.id}:${cell.level}` : cell.id;
  useEffect(() => {
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: false }).start();
  }, [contentKey, pop]);

  // The ref is only read inside gesture callbacks, never during render.
  /* eslint-disable react-hooks/refs */
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          pan.setValue({ x: 0, y: 0 });
          handlers.current.onGrab(index);
        },
        onPanResponderMove: (_, g) => {
          pan.setValue({ x: g.dx, y: g.dy });
          handlers.current.onMove(g.moveX, g.moveY);
        },
        onPanResponderRelease: (_, g) => {
          pan.setValue({ x: 0, y: 0 });
          if (Math.abs(g.dx) + Math.abs(g.dy) < 8) {
            handlers.current.onCancel();
            handlers.current.onTap(index);
          } else {
            handlers.current.onRelease(index, g.moveX, g.moveY);
          }
        },
        onPanResponderTerminate: () => {
          pan.setValue({ x: 0, y: 0 });
          handlers.current.onCancel();
        },
      }),
    [index, pan],
  );
  /* eslint-enable react-hooks/refs */

  const creature = cell.kind === 'creature' ? getCreature(cell.id) : null;
  const border = creature ? creature.rarity.color : colors.ingredientBorder;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderColor: selected ? colors.lime : border,
          backgroundColor: creature ? colors.creatureTile : colors.ingredientTile,
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: pop }],
        },
      ]}
    >
      {cell.kind === 'creature' ? (
        <CreatureArt id={cell.id} size={size - 6} />
      ) : (
        <IngredientArt id={cell.id} size={size - 8} />
      )}
      {cell.kind === 'creature' && (
        <View style={[styles.level, { backgroundColor: border }]}>
          <Text style={styles.levelText}>{cell.level}</Text>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    borderRadius: 14,
    backgroundColor: colors.cell,
  },
  cellHover: {
    backgroundColor: colors.cellHover,
  },
  tile: {
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Prevent the browser from scrolling or selecting while dragging.
    userSelect: 'none',
    touchAction: 'none',
    cursor: 'grab',
  } as never,
  level: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
});
