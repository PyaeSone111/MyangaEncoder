import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockDesignPreset, BlockDesignStyle, DetectedBlock } from '../types';
import { normalizeFontWeight } from './color';

const STORAGE_KEY = '@myangar_encode/design_presets';

export interface MangaDesignTemplate extends BlockDesignStyle {
  id: string;
  name: string;
  description: string;
}

export const MANGA_DESIGN_TEMPLATES: MangaDesignTemplate[] = [
  {
    id: 'dialogue',
    name: 'Dialogue bubble',
    description: 'Clean, readable speech',
    fontSize: 18,
    lineHeight: 27,
    textColor: '#171717',
    backgroundColor: '#FFFFFF',
    fontWeight: 500,
    fontStyle: 'normal',
    textAlign: 'center',
    letterSpacing: 0,
    textDecorationLine: 'none',
    borderEnabled: true,
    borderWidth: 2,
    borderColor: '#171717',
  },
  {
    id: 'narration',
    name: 'Narration box',
    description: 'Quiet story captions',
    fontSize: 16,
    lineHeight: 24,
    textColor: '#24180D',
    backgroundColor: '#FFF4D6',
    fontWeight: 400,
    fontStyle: 'normal',
    textAlign: 'left',
    letterSpacing: 0.2,
    textDecorationLine: 'none',
    borderEnabled: true,
    borderWidth: 1,
    borderColor: '#C49A52',
  },
  {
    id: 'sound-effect',
    name: 'Sound effect',
    description: 'Bold action lettering',
    fontSize: 28,
    lineHeight: 34,
    textColor: '#FFFFFF',
    backgroundColor: 'transparent',
    fontWeight: 800,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 1,
    textDecorationLine: 'none',
    borderEnabled: true,
    borderWidth: 4,
    borderColor: '#111111',
  },
  {
    id: 'whisper',
    name: 'Whisper',
    description: 'Soft, subtle dialogue',
    fontSize: 15,
    lineHeight: 22,
    textColor: '#596273',
    backgroundColor: 'transparent',
    fontWeight: 400,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.4,
    textDecorationLine: 'none',
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#596273',
  },
  {
    id: 'emphasis',
    name: 'Emphasis',
    description: 'High-impact reveal text',
    fontSize: 22,
    lineHeight: 28,
    textColor: '#B42318',
    backgroundColor: '#FFF1F0',
    fontWeight: 700,
    fontStyle: 'normal',
    textAlign: 'center',
    letterSpacing: 0.5,
    textDecorationLine: 'none',
    borderEnabled: true,
    borderWidth: 2,
    borderColor: '#B42318',
  },
];

function normalizeDesignStyle(style: Partial<BlockDesignStyle>): BlockDesignStyle {
  return {
    fontSize: style.fontSize ?? 16,
    lineHeight: style.lineHeight ?? 24,
    textColor: style.textColor ?? '#111111',
    backgroundColor: style.backgroundColor ?? '#ffffff',
    fontWeight: normalizeFontWeight(style.fontWeight),
    fontStyle: style.fontStyle ?? 'normal',
    textAlign: style.textAlign ?? 'center',
    letterSpacing: style.letterSpacing ?? 0,
    textDecorationLine: style.textDecorationLine ?? 'none',
    borderEnabled: style.borderEnabled ?? false,
    borderWidth: style.borderWidth ?? 2,
    borderColor: style.borderColor ?? '#000000',
  };
}

export function designFromBlock(block: DetectedBlock): BlockDesignStyle {
  return normalizeDesignStyle(block);
}

export async function loadDesignPresets(): Promise<BlockDesignPreset[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BlockDesignPreset[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((preset) => ({
      ...preset,
      ...normalizeDesignStyle(preset),
    }));
  } catch {
    return [];
  }
}

export async function saveDesignPreset(
  name: string,
  style: BlockDesignStyle
): Promise<BlockDesignPreset[]> {
  const presets = await loadDesignPresets();
  const preset: BlockDesignPreset = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    ...normalizeDesignStyle(style),
  };
  const next = [...presets, preset];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function deleteDesignPreset(id: string): Promise<BlockDesignPreset[]> {
  const presets = await loadDesignPresets();
  const next = presets.filter((preset) => preset.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
