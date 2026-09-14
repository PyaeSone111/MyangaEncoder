import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { clamp01, hexToRgb, hsvToRgb, parseColorInput, rgbToHex, rgbToHsv } from '../utils/color';

const WHEEL_SIZE = 156;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const RING_INNER = 46;
const RING_OUTER = WHEEL_SIZE / 2 - 4;
const SV_SIZE = 88;
const HUE_SEGMENTS = 72;

interface Props {
  value: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

function colorToHsv(color: string): Hsv {
  if (color === 'transparent') return { h: 0, s: 0, v: 1 };
  const rgb = hexToRgb(color);
  return rgb ? rgbToHsv(rgb) : { h: 210, s: 0.8, v: 0.9 };
}

export function ColorWheelPicker({ value, onChange, allowTransparent = false }: Props) {
  const initial = useMemo(() => colorToHsv(value), [value]);
  const [hsv, setHsv] = useState(initial);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  const applyHsv = useCallback(
    (next: Hsv) => {
      hsvRef.current = next;
      setHsv(next);
      onChange(rgbToHex(hsvToRgb(next.h, next.s, next.v)));
    },
    [onChange]
  );

  const [hexDraft, setHexDraft] = useState(value === 'transparent' ? '#FFFFFF' : value);

  const syncFromValue = useCallback(() => {
    if (value === 'transparent') return;
    const next = colorToHsv(value);
    hsvRef.current = next;
    setHsv(next);
    setHexDraft(value.toUpperCase());
  }, [value]);

  React.useEffect(() => {
    syncFromValue();
  }, [value, syncFromValue]);

  const hueFromPoint = (x: number, y: number) => {
    const dx = x - WHEEL_CENTER;
    const dy = y - WHEEL_CENTER;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return (angle + 360) % 360;
  };

  const distanceFromCenter = (x: number, y: number) => {
    const dx = x - WHEEL_CENTER;
    const dy = y - WHEEL_CENTER;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const wheelResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const dist = distanceFromCenter(locationX, locationY);
          if (dist >= RING_INNER && dist <= RING_OUTER + 8) {
            applyHsv({ ...hsvRef.current, h: hueFromPoint(locationX, locationY) });
          }
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          applyHsv({ ...hsvRef.current, h: hueFromPoint(locationX, locationY) });
        },
      }),
    [applyHsv]
  );

  const [svBox, setSvBox] = useState({ width: SV_SIZE, height: SV_SIZE });

  const svFromPoint = (x: number, y: number) => {
    const s = clamp01(x / svBox.width);
    const v = clamp01(1 - y / svBox.height);
    applyHsv({ ...hsvRef.current, s, v });
  };

  const svResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          svFromPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
        },
        onPanResponderMove: (event) => {
          svFromPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
        },
      }),
    [applyHsv, svBox.height, svBox.width]
  );

  const hueSegments = useMemo(
    () =>
      Array.from({ length: HUE_SEGMENTS }, (_, index) => {
        const hue = (index / HUE_SEGMENTS) * 360;
        const midAngle = ((index + 0.5) / HUE_SEGMENTS) * 2 * Math.PI - Math.PI / 2;
        const radius = (RING_INNER + RING_OUTER) / 2;
        const x = WHEEL_CENTER + Math.cos(midAngle) * radius;
        const y = WHEEL_CENTER + Math.sin(midAngle) * radius;
        return {
          key: index,
          hue,
          color: rgbToHex(hsvToRgb(hue, 1, 1)),
          x,
          y,
          rotation: hue + 90,
        };
      }),
    []
  );

  const previewColor =
    value === 'transparent' ? 'transparent' : rgbToHex(hsvToRgb(hsv.h, hsv.s, hsv.v));
  const huePreview = rgbToHex(hsvToRgb(hsv.h, 1, 1));

  return (
    <View style={styles.root}>
      <View style={styles.wheelRow}>
        <View style={styles.wheelWrap} {...wheelResponder.panHandlers}>
          <View style={styles.wheelClip}>
            {hueSegments.map((segment) => (
              <View
                key={segment.key}
                style={[
                  styles.hueSegment,
                  {
                    left: segment.x - 3,
                    top: segment.y - 10,
                    backgroundColor: segment.color,
                    transform: [{ rotate: `${segment.rotation}deg` }],
                  },
                ]}
              />
            ))}
            <View
              style={[
                styles.hueMarker,
                {
                  left:
                    WHEEL_CENTER +
                    Math.cos((hsv.h * Math.PI) / 180 - Math.PI / 2) * ((RING_INNER + RING_OUTER) / 2) -
                    7,
                  top:
                    WHEEL_CENTER +
                    Math.sin((hsv.h * Math.PI) / 180 - Math.PI / 2) * ((RING_INNER + RING_OUTER) / 2) -
                    7,
                },
              ]}
            />
          </View>

          <View
            style={styles.svWrap}
            onLayout={(event: LayoutChangeEvent) => {
              const { width, height } = event.nativeEvent.layout;
              setSvBox({ width, height });
            }}
            {...svResponder.panHandlers}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: huePreview }]} />
            <View style={styles.whiteOverlay}>
              {Array.from({ length: 10 }, (_, i) => (
                <View
                  key={`w-${i}`}
                  style={[styles.whiteStrip, { backgroundColor: `rgba(255,255,255,${i / 9})` }]}
                />
              ))}
            </View>
            <View style={styles.blackOverlay}>
              {Array.from({ length: 10 }, (_, i) => (
                <View
                  key={`b-${i}`}
                  style={[styles.blackStrip, { backgroundColor: `rgba(0,0,0,${i / 9})` }]}
                />
              ))}
            </View>
            <View
              style={[
                styles.svMarker,
                {
                  left: clamp01(hsv.s) * svBox.width - 6,
                  top: (1 - clamp01(hsv.v)) * svBox.height - 6,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.metaCol}>
          <View
            style={[
              styles.preview,
              previewColor === 'transparent' && styles.previewTransparent,
              previewColor !== 'transparent' && { backgroundColor: previewColor },
            ]}
          />
          <TextInput
            style={styles.hexInput}
            value={hexDraft}
            onChangeText={setHexDraft}
            autoCapitalize="characters"
            maxLength={7}
            onBlur={() => {
              const parsed = parseColorInput(hexDraft);
              if (parsed) {
                applyHsv(colorToHsv(parsed));
                setHexDraft(parsed);
              } else {
                setHexDraft(previewColor === 'transparent' ? '#FFFFFF' : previewColor);
              }
            }}
          />
          {allowTransparent && (
            <Pressable onPress={() => onChange('transparent')}>
              <Text
                style={[styles.transparentBtn, value === 'transparent' && styles.transparentBtnActive]}
              >
                Transparent
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 8,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wheelWrap: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
  },
  hueSegment: {
    position: 'absolute',
    width: 6,
    height: 20,
    borderRadius: 2,
  },
  hueMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    elevation: 2,
  },
  svWrap: {
    width: SV_SIZE,
    height: SV_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  whiteStrip: {
    flex: 1,
  },
  blackOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  blackStrip: {
    flex: 1,
  },
  svMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  metaCol: {
    flex: 1,
    gap: 8,
  },
  preview: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  previewTransparent: {
    backgroundColor: '#fff',
    borderStyle: 'dashed',
  },
  hexInput: {
    borderWidth: 1,
    borderColor: '#e2e6ea',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#343a40',
  },
  transparentBtn: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    paddingVertical: 6,
  },
  transparentBtnActive: {
    color: '#4a90d9',
  },
});
