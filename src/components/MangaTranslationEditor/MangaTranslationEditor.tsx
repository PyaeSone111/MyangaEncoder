import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { DetectedBlock } from '../../types';
import { MangaImage } from '../MangaImage';
import { BlockEditorModal } from './BlockEditorModal';
import { ExportCanvas, ExportCanvasHandle } from './ExportCanvas';
import { TextBlockOverlay } from './TextBlockOverlay';
import { createDefaultBlockStyle, normalizeBlock } from './constants';

interface CanvasLayerProps {
  imageUri: string;
  screenWidth: number;
  displayHeight: number;
  imageWidth: number;
  imageHeight: number;
  scale: number;
  blocks: DetectedBlock[];
  selectedId: number | null;
  showGuides: boolean;
  onSelect: (id: number) => void;
  onOpenEditor: (id: number) => void;
  onMove: (id: number, x: number, y: number) => void;
  onResize: (id: number, width: number, height: number) => void;
  onRotate: (id: number, rotation: number) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

function CanvasLayer({
  imageUri,
  screenWidth,
  displayHeight,
  imageWidth,
  imageHeight,
  scale,
  blocks,
  selectedId,
  showGuides,
  onSelect,
  onOpenEditor,
  onMove,
  onResize,
  onRotate,
  onInteractionStart,
  onInteractionEnd,
}: CanvasLayerProps) {
  return (
    <View style={{ width: screenWidth, height: displayHeight }} collapsable={false}>
      <MangaImage
        uri={imageUri}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        layoutWidth={screenWidth}
        layoutHeight={displayHeight}
      />

      {blocks.map((block) => (
        <TextBlockOverlay
          key={block.id}
          block={block}
          scale={scale}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          selected={block.id === selectedId}
          showGuides={showGuides}
          exporting={false}
          onSelect={onSelect}
          onOpenEditor={onOpenEditor}
          onMove={onMove}
          onResize={onResize}
          onRotate={onRotate}
          onInteractionStart={onInteractionStart}
          onInteractionEnd={onInteractionEnd}
        />
      ))}
    </View>
  );
}

export interface MangaTranslationEditorProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  initialBlocks?: DetectedBlock[];
}

export interface MangaTranslationEditorHandle {
  capture: () => Promise<string>;
  getBlocks: () => DetectedBlock[];
}

export const MangaTranslationEditor = forwardRef<
  MangaTranslationEditorHandle,
  MangaTranslationEditorProps
>(function MangaTranslationEditor(
  { imageUri, imageWidth, imageHeight, initialBlocks = [] },
  ref
) {
  const { width: screenWidth } = useWindowDimensions();
  const scale = screenWidth / imageWidth;
  const displayHeight = imageHeight * scale;

  const scrollRef = useRef<ScrollView>(null);
  const exportRef = useRef<ExportCanvasHandle>(null);
  const scrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const [detectedBlocks, setDetectedBlocks] = useState<DetectedBlock[]>(() =>
    initialBlocks.map(normalizeBlock)
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalBlockId, setModalBlockId] = useState<number | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const interactionCountRef = useRef(0);

  const modalBlock = detectedBlocks.find((b) => b.id === modalBlockId) ?? null;
  const nextId = Math.max(0, ...detectedBlocks.map((b) => b.id)) + 1;

  const updateBlock = useCallback((id: number, patch: Partial<DetectedBlock>) => {
    setDetectedBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, ...patch } : block))
    );
  }, []);

  const handleMove = useCallback(
    (id: number, x: number, y: number) => updateBlock(id, { x, y }),
    [updateBlock]
  );

  const handleResize = useCallback(
    (id: number, width: number, height: number) => updateBlock(id, { width, height }),
    [updateBlock]
  );

  const handleRotate = useCallback(
    (id: number, rotation: number) => updateBlock(id, { rotation }),
    [updateBlock]
  );

  const addBlock = useCallback(() => {
    const width = Math.round(imageWidth * 0.6);
    const height = Math.max(40, Math.round(imageHeight * 0.04));
    const fontSize = Math.max(14, Math.round(height * 0.7));
    const viewportCenterY = scrollYRef.current + viewportHeightRef.current / 2;
    const y = Math.round(
      Math.max(0, Math.min(imageHeight - height, viewportCenterY / scale - height / 2))
    );
    const newBlock = createDefaultBlockStyle({
      id: nextId,
      originalText: '',
      x: Math.round((imageWidth - width) / 2),
      y,
      width,
      height,
      fontSize,
    });
    setDetectedBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
    setModalBlockId(newBlock.id);
  }, [imageHeight, imageWidth, nextId, scale]);

  const handleInteractionStart = useCallback(() => {
    interactionCountRef.current += 1;
    setScrollEnabled(false);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    interactionCountRef.current = Math.max(0, interactionCountRef.current - 1);
    if (interactionCountRef.current === 0) {
      setScrollEnabled(true);
    }
  }, []);

  const capture = useCallback(async (): Promise<string> => {
    setSelectedId(null);
    setModalBlockId(null);

    const exportBlocks = detectedBlocks.filter(
      (block) => block.submitted && block.translatedText.trim().length > 0
    );
    if (exportBlocks.length === 0) {
      throw new Error('No translated text to encode');
    }

    return exportRef.current!.capture();
  }, [detectedBlocks]);

  useImperativeHandle(
    ref,
    () => ({
      capture,
      getBlocks: () => detectedBlocks,
    }),
    [capture, detectedBlocks]
  );

  const exportBlocks = detectedBlocks.filter(
    (block) => block.submitted && block.translatedText.trim().length > 0
  );

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        viewportHeightRef.current = event.nativeEvent.layout.height;
      }}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ width: screenWidth, height: displayHeight }}
        showsVerticalScrollIndicator
        bounces={false}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        collapsable={false}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
      >
        <CanvasLayer
          imageUri={imageUri}
          screenWidth={screenWidth}
          displayHeight={displayHeight}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          scale={scale}
          blocks={detectedBlocks}
          selectedId={selectedId}
          showGuides={showGuides}
          onSelect={setSelectedId}
          onOpenEditor={(id) => {
            setSelectedId(id);
            setModalBlockId(id);
          }}
          onMove={handleMove}
          onResize={handleResize}
          onRotate={handleRotate}
          onInteractionStart={handleInteractionStart}
          onInteractionEnd={handleInteractionEnd}
        />
      </ScrollView>

      <ExportCanvas
        ref={exportRef}
        imageUri={imageUri}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        blocks={exportBlocks}
      />

      <View style={styles.fabRow}>
        <Pressable style={styles.fab} onPress={addBlock}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
        <Pressable
          style={[styles.fab, styles.fabSecondary, showGuides && styles.fabActive]}
          onPress={() => setShowGuides((v) => !v)}
        >
          <Text style={[styles.fabSecondaryText, showGuides && styles.fabActiveText]}>□</Text>
        </Pressable>
      </View>

      <BlockEditorModal
        visible={modalBlockId !== null}
        block={modalBlock}
        onChangeTranslation={(text) => modalBlockId && updateBlock(modalBlockId, { translatedText: text })}
        onSubmit={() => {
          if (!modalBlockId) return;
          updateBlock(modalBlockId, { submitted: true });
          setSelectedId(modalBlockId);
          setModalBlockId(null);
        }}
        onPatch={(patch) => modalBlockId && updateBlock(modalBlockId, patch)}
        onDelete={() => {
          if (!modalBlockId) return;
          setDetectedBlocks((prev) => prev.filter((b) => b.id !== modalBlockId));
          setSelectedId(null);
          setModalBlockId(null);
        }}
        onClose={() => {
          setModalBlockId(null);
          if (modalBlockId) setSelectedId(modalBlockId);
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    flex: 1,
  },
  fabRow: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    gap: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4a90d9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
  },
  fabSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4a90d9',
  },
  fabSecondaryText: {
    color: '#4a90d9',
    fontSize: 20,
    fontWeight: '700',
  },
  fabActive: {
    backgroundColor: '#4a90d9',
  },
  fabActiveText: {
    color: '#fff',
  },
});
