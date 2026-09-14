import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockDesignPreset, BlockDesignStyle, DetectedBlock } from '../types';
import { normalizeFontWeight } from './color';

const STORAGE_KEY = '@myangar_encode/design_presets';

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
