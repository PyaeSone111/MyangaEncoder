import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DetectedBlock } from '../../types';
import { clamp } from '../../utils/image';
import { MAX_ROTATION, MIN_BLOCK_SIZE, MIN_ROTATION } from './constants';
import { StrokedMyanmarText } from './StrokedMyanmarText';

const DOUBLE_TAP_MS = 320;
const HANDLE = 32;

interface Props {
  block: DetectedBlock;
  scale: number;
  imageWidth: number;
  imageHeight: number;
  selected: boolean;
  showGuides: boolean;
  exporting: boolean;
  onSelect: (id: number) => void;
  onOpenEditor: (id: number) => void;
  onMove: (id: number, x: number, y: number) => void;
  onResize: (id: number, width: number, height: number) => void;
  onRotate: (id: number, rotation: number) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

export function TextBlockOverlay({
  block,
  scale,
  imageWidth,
  imageHeight,
  selected,
  showGuides,
  exporting,
  onSelect,
  onOpenEditor,
  onMove,
  onResize,
  onRotate,
  onInteractionStart,
  onInteractionEnd,
}: Props) {
  const blockRef = useRef(block);
  blockRef.current = block;

  const startPos = useRef({ x: block.x, y: block.y });
  const startSize = useRef({ width: block.width, height: block.height });
  const startRotation = useRef(block.rotation);

  const hasTranslation = block.translatedText.trim().length > 0;
  const canEdit = showGuides && !exporting;
  const showHandles = selected && canEdit;
  const showBackground =
    hasTranslation && block.backgroundColor !== 'transparent' && (exporting || hasTranslation);

  const bodyGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(canEdit)
      .activeOffsetX([-6, 6])
      .activeOffsetY([-6, 6])
      .onBegin(() => {
        const current = blockRef.current;
        startPos.current = { x: current.x, y: current.y };
        onInteractionStart();
        onSelect(block.id);
      })
      .onUpdate((event) => {
        const current = blockRef.current;
        const nextX = clamp(
          startPos.current.x + event.translationX / scale,
          0,
          imageWidth - current.width
        );
        const nextY = clamp(
          startPos.current.y + event.translationY / scale,
          0,
          imageHeight - current.height
        );
        onMove(block.id, Math.round(nextX), Math.round(nextY));
      })
      .onFinalize(() => onInteractionEnd());

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(DOUBLE_TAP_MS)
      .enabled(canEdit)
      .onEnd(() => onOpenEditor(block.id));

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(250)
      .enabled(canEdit)
      .onEnd(() => onSelect(block.id));

    return Gesture.Race(pan, Gesture.Exclusive(doubleTap, singleTap));
  }, [
    block.id,
    canEdit,
    imageHeight,
    imageWidth,
    onInteractionEnd,
    onInteractionStart,
    onMove,
    onOpenEditor,
    onSelect,
    scale,
  ]);

  const resizeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(showHandles)
        .onBegin(() => {
          const current = blockRef.current;
          startSize.current = { width: current.width, height: current.height };
          onInteractionStart();
        })
        .onUpdate((event) => {
          const current = blockRef.current;
          const width = Math.max(
            MIN_BLOCK_SIZE,
            Math.round(startSize.current.width + event.translationX / scale)
          );
          const height = Math.max(
            MIN_BLOCK_SIZE,
            Math.round(startSize.current.height + event.translationY / scale)
          );
          const maxW = imageWidth - current.x;
          const maxH = imageHeight - current.y;
          onResize(block.id, Math.min(width, maxW), Math.min(height, maxH));
        })
        .onFinalize(() => onInteractionEnd()),
    [
      block.id,
      imageHeight,
      imageWidth,
      onInteractionEnd,
      onInteractionStart,
      onResize,
      scale,
      showHandles,
    ]
  );

  const rotateGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(showHandles)
        .onBegin(() => {
          startRotation.current = blockRef.current.rotation;
          onInteractionStart();
        })
        .onUpdate((event) => {
          const next = clamp(
            Math.round(startRotation.current + event.translationX * 0.4),
            MIN_ROTATION,
            MAX_ROTATION
          );
          onRotate(block.id, next);
        })
        .onFinalize(() => onInteractionEnd()),
    [block.id, onInteractionEnd, onInteractionStart, onRotate, showHandles]
  );

  const showGuideOutline = showGuides && !exporting;

  return (
    <View
      style={[
        styles.wrapper,
        {
          left: block.x * scale,
          top: block.y * scale,
          width: block.width * scale,
          height: block.height * scale,
          transform: [{ rotate: `${block.rotation}deg` }],
          zIndex: selected ? 20 : 10,
        },
      ]}
      collapsable={false}
    >
      <GestureDetector gesture={bodyGesture}>
        <View
          style={[
            styles.overlay,
            showGuideOutline && {
              borderColor: selected ? '#28a745' : '#4a90d9',
              borderWidth: selected ? 2 : 1,
            },
          ]}
        >
          <View style={styles.contentBox}>
            {showBackground && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: block.backgroundColor, opacity: exporting ? 1 : 0.92 },
                ]}
              />
            )}

            {hasTranslation ? (
              <View style={styles.textWrap}>
                <StrokedMyanmarText block={block} text={block.translatedText} scale={scale} />
              </View>
            ) : (
              showGuides &&
              !exporting && (
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Double tap to translate</Text>
                </View>
              )
            )}
          </View>
        </View>
      </GestureDetector>

      {showGuides && !exporting && (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{block.id}</Text>
        </View>
      )}

      {showHandles && (
        <>
          <GestureDetector gesture={resizeGesture}>
            <View style={styles.handleResize} />
          </GestureDetector>
          <GestureDetector gesture={rotateGesture}>
            <View style={styles.handleRotate}>
              <Text style={styles.handleRotateIcon}>↻</Text>
            </View>
          </GestureDetector>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 2,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  contentBox: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  tapHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHintText: {
    fontSize: 10,
    color: '#4a90d9',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  badge: {
    position: 'absolute',
    top: -14,
    left: 0,
    backgroundColor: '#4a90d9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  handleResize: {
    position: 'absolute',
    right: -HANDLE / 2,
    bottom: -HANDLE / 2,
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    backgroundColor: '#28a745',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 30,
  },
  handleRotate: {
    position: 'absolute',
    top: -HANDLE - 8,
    left: '50%',
    marginLeft: -HANDLE / 2,
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    backgroundColor: '#ffc107',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  handleRotateIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
