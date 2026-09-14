import TextRecognition from '@react-native-ml-kit/text-recognition';
import { createDefaultBlockStyle } from '../components/MangaTranslationEditor/constants';
import { DetectedBlock } from '../types';

interface RecognizedBlock {
  text?: string;
  frame?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

/**
 * Runs on-device OCR and maps ML Kit blocks into editor-ready coordinates.
 */
export async function detectTextBlocks(imageUri: string): Promise<DetectedBlock[]> {
  const result = await TextRecognition.recognize(imageUri);
  const blocks: RecognizedBlock[] = result.blocks ?? [];
  const detected: DetectedBlock[] = [];

  blocks.forEach((block, index) => {
    const text = (block.text ?? '').trim();
    const frame = block.frame;
    if (!text || !frame) return;

    const width = Math.round(frame.width);
    const height = Math.round(frame.height);
    const fontSize = Math.max(12, Math.round(height * 0.75));

    detected.push(
      createDefaultBlockStyle({
        id: index + 1,
        originalText: text,
        x: Math.round(frame.left),
        y: Math.round(frame.top),
        width,
        height,
        fontSize,
      })
    );
  });

  return detected;
}

/** @deprecated Use detectTextBlocks */
export const detectText = detectTextBlocks;
