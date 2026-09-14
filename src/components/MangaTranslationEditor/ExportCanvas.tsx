import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { PixelRatio, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { DetectedBlock } from '../../types';
import { MangaImage } from '../MangaImage';
import { TextBlockOverlay } from './TextBlockOverlay';

export interface ExportCanvasHandle {
  capture: () => Promise<string>;
}

interface Props {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  blocks: DetectedBlock[];
}

const noop = () => {};

/**
 * Off-screen 1:1 export canvas. Layout uses dp = imagePixels / PixelRatio so ViewShot
 * captures at the source image's native pixel dimensions (sharp text, exact positions).
 */
export const ExportCanvas = forwardRef<ExportCanvasHandle, Props>(function ExportCanvas(
  { imageUri, imageWidth, imageHeight, blocks },
  ref
) {
  const shotRef = useRef<ViewShot>(null);
  const exportScale = 1 / PixelRatio.get();
  const layoutWidth = imageWidth * exportScale;
  const layoutHeight = imageHeight * exportScale;

  useImperativeHandle(ref, () => ({
    async capture() {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const uri = await shotRef.current?.capture?.();
      if (!uri) {
        throw new Error('Could not capture encoded image');
      }
      return uri.startsWith('file://') ? uri : `file://${uri}`;
    },
  }));

  return (
    <View style={styles.host} pointerEvents="none">
      <ViewShot
        ref={shotRef}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={{ width: layoutWidth, height: layoutHeight }}
      >
        <View style={{ width: layoutWidth, height: layoutHeight }} collapsable={false}>
          <MangaImage
            uri={imageUri}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            layoutWidth={layoutWidth}
            layoutHeight={layoutHeight}
          />
          {blocks.map((block) => (
            <TextBlockOverlay
              key={block.id}
              block={block}
              scale={exportScale}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              selected={false}
              showGuides={false}
              exporting
              onSelect={noop}
              onOpenEditor={noop}
              onMove={noop}
              onResize={noop}
              onRotate={noop}
              onInteractionStart={noop}
              onInteractionEnd={noop}
            />
          ))}
        </View>
      </ViewShot>
    </View>
  );
});

const styles = {
  host: {
    position: 'absolute' as const,
    left: -50000,
    top: 0,
    opacity: 1,
  },
};
