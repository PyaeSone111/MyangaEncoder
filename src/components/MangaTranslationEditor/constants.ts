import { Platform, TextStyle } from 'react-native';
import { DetectedBlock } from '../../types';
import { normalizeFontWeight } from '../../utils/color';

export const TEXT_COLOR_PRESETS = ['#111111', '#ffffff', '#dc3545', '#4a90d9', '#198754', '#ffc107'] as const;

export const BACKGROUND_COLOR_PRESETS = [
  'transparent',
  '#ffffff',
  '#000000',
  '#fffde7',
  '#f8f9fa',
] as const;

export const BORDER_COLOR_PRESETS = ['#000000', '#ffffff', '#dc3545', '#4a90d9', '#ffc107'] as const;

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;
export const MIN_LINE_HEIGHT = 10;
export const MAX_LINE_HEIGHT = 160;
export const MIN_BLOCK_SIZE = 24;
export const MIN_ROTATION = -180;
export const MAX_ROTATION = 180;
export const MIN_FONT_WEIGHT = 100;
export const MAX_FONT_WEIGHT = 900;
export const MIN_BORDER_WIDTH = 0;
export const MAX_BORDER_WIDTH = 12;

/** Linked Noto Sans Myanmar family — https://fonts.google.com/noto/specimen/Noto+Sans+Myanmar */
export const NOTO_SANS_MYANMAR = {
  regular: 'NotoSansMyanmar_400Regular',
  medium: 'NotoSansMyanmar_500Medium',
  semiBold: 'NotoSansMyanmar_600SemiBold',
  bold: 'NotoSansMyanmar_700Bold',
} as const;

export function resolveFontFamily(weight: number): string {
  const w = normalizeFontWeight(weight);
  if (w >= 700) return NOTO_SANS_MYANMAR.bold;
  if (w >= 600) return NOTO_SANS_MYANMAR.semiBold;
  if (w >= 500) return NOTO_SANS_MYANMAR.medium;
  return NOTO_SANS_MYANMAR.regular;
}

export function fontWeightStyle(weight: number): TextStyle['fontWeight'] {
  const rounded = Math.round(normalizeFontWeight(weight) / 100) * 100;
  return String(rounded) as TextStyle['fontWeight'];
}

export function defaultLineHeight(fontSize: number): number {
  return Math.max(MIN_LINE_HEIGHT, Math.round(fontSize * 1.5));
}

export function lineHeightForFontSize(fontSize: number): number {
  return Math.min(MAX_LINE_HEIGHT, defaultLineHeight(fontSize));
}

type MyanmarTextStyleMode = 'canvas' | 'editor';

export function buildMyanmarTextStyle(
  block: DetectedBlock,
  scale: number,
  mode: MyanmarTextStyleMode = 'canvas'
): TextStyle {
  const fontSize =
    mode === 'editor' ? block.fontSize : Math.max(8, Math.round(block.fontSize * scale));
  const lineHeight =
    mode === 'editor'
      ? block.lineHeight
      : Math.max(fontSize * 1.2, Math.round(block.lineHeight * scale));

  return {
    fontFamily: resolveFontFamily(block.fontWeight),
    fontWeight: fontWeightStyle(block.fontWeight),
    fontSize,
    lineHeight,
    color: block.textColor,
    fontStyle: block.fontStyle,
    textAlign: block.textAlign,
    letterSpacing: block.letterSpacing * (mode === 'editor' ? 1 : scale),
    textDecorationLine: block.textDecorationLine,
    includeFontPadding: false,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {}),
  };
}

export function estimateTextInputHeight(block: DetectedBlock, text: string): number {
  const lines = Math.max(1, text.split('\n').length);
  const burmesePad = Math.round(block.lineHeight * 0.15);
  return Math.max(96, lines * block.lineHeight + 32 + burmesePad);
}

export function normalizeBlock(block: DetectedBlock): DetectedBlock {
  return {
    ...block,
    fontWeight: normalizeFontWeight(block.fontWeight),
    borderEnabled: block.borderEnabled ?? false,
    borderWidth: block.borderWidth ?? 2,
    borderColor: block.borderColor ?? '#000000',
  };
}

export function createDefaultBlockStyle(
  partial: Pick<
    DetectedBlock,
    'id' | 'originalText' | 'x' | 'y' | 'width' | 'height' | 'fontSize'
  > &
    Partial<DetectedBlock>
): DetectedBlock {
  const fontSize = partial.fontSize;
  return {
    translatedText: '',
    textColor: '#111111',
    backgroundColor: '#ffffff',
    lineHeight: defaultLineHeight(fontSize),
    fontWeight: 400,
    fontStyle: 'normal',
    textAlign: 'center',
    letterSpacing: 0,
    textDecorationLine: 'none',
    borderEnabled: false,
    borderWidth: 2,
    borderColor: '#000000',
    rotation: 0,
    submitted: false,
    ...partial,
  };
}
