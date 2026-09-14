import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { DetectedBlock } from '../../types';
import { buildMyanmarTextStyle } from './constants';

type StrokeMode = 'canvas' | 'editor';

interface Props {
  block: DetectedBlock;
  text: string;
  scale?: number;
  mode?: StrokeMode;
  style?: TextStyle;
}

function strokeWidth(block: DetectedBlock, scale: number, mode: StrokeMode): number {
  if (!block.borderEnabled || block.borderWidth <= 0) return 0;
  return Math.max(1, Math.round(block.borderWidth * (mode === 'editor' ? 1 : scale)));
}

/** Renders Myanmar text with an outline stroke around the glyphs (not the box). */
export function StrokedMyanmarText({
  block,
  text,
  scale = 1,
  mode = 'canvas',
  style,
}: Props) {
  const textStyle = buildMyanmarTextStyle(block, scale, mode);
  const width = strokeWidth(block, scale, mode);

  const offsets = useMemo(() => {
    if (width <= 0) return [];
    return [
      [-width, 0],
      [width, 0],
      [0, -width],
      [0, width],
      [-width, -width],
      [-width, width],
      [width, -width],
      [width, width],
    ] as const;
  }, [width]);

  if (width <= 0) {
    return <Text style={[textStyle, styles.fill, style]}>{text}</Text>;
  }

  return (
    <View style={styles.root}>
      <Text style={[textStyle, styles.sizer, style]} accessible={false} importantForAccessibility="no">
        {text}
      </Text>
      {offsets.map(([dx, dy], index) => (
        <Text
          key={index}
          style={[
            textStyle,
            styles.layer,
            style,
            { color: block.borderColor, left: dx, top: dy },
          ]}
          accessible={false}
          importantForAccessibility="no"
        >
          {text}
        </Text>
      ))}
      <Text style={[textStyle, styles.layer, style]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    position: 'relative',
  },
  sizer: {
    opacity: 0,
    width: '100%',
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
  },
  fill: {
    width: '100%',
  },
});
