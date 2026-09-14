import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BlockDesignPreset,
  DetectedBlock,
  FontStyleOption,
  TextAlign,
  TextDecorationOption,
} from '../../types';
import { ColorWheelPicker } from '../ColorWheelPicker';
import {
  deleteDesignPreset,
  designFromBlock,
  loadDesignPresets,
  saveDesignPreset,
} from '../../utils/designPresets';
import {
  BACKGROUND_COLOR_PRESETS,
  BORDER_COLOR_PRESETS,
  MAX_BORDER_WIDTH,
  MAX_FONT_SIZE,
  MAX_LINE_HEIGHT,
  MAX_ROTATION,
  MIN_BORDER_WIDTH,
  MIN_FONT_SIZE,
  MIN_LINE_HEIGHT,
  MIN_ROTATION,
  NOTO_SANS_MYANMAR,
  TEXT_COLOR_PRESETS,
  buildMyanmarTextStyle,
  estimateTextInputHeight,
  lineHeightForFontSize,
} from './constants';
import { StrokedMyanmarText } from './StrokedMyanmarText';
import { normalizeFontWeight } from '../../utils/color';

type TabKey = 'text' | 'design';

interface Props {
  visible: boolean;
  block: DetectedBlock | null;
  onChangeTranslation: (text: string) => void;
  onSubmit: () => void;
  onPatch: (patch: Partial<DetectedBlock>) => void;
  onDelete: () => void;
  onClose: () => void;
}

function ColorSwatch({
  color,
  selected,
  label,
  onPress,
}: {
  color: string;
  selected: boolean;
  label?: string;
  onPress: () => void;
}) {
  const isTransparent = color === 'transparent';
  return (
    <Pressable
      onPress={onPress}
      style={[styles.swatch, selected && styles.swatchSelected]}
      accessibilityLabel={label ?? color}
    >
      <View
        style={[
          styles.swatchInner,
          isTransparent && styles.swatchTransparent,
          !isTransparent && { backgroundColor: color },
        ]}
      />
    </Pressable>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StepRow({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.stepBtn} onPress={onDecrease}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={onIncrease}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Compact bottom sheet: original text pinned on top, scrollable tab content below.
 */
export function BlockEditorModal({
  visible,
  block,
  onChangeTranslation,
  onSubmit,
  onPatch,
  onDelete,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draftText, setDraftText] = useState('');
  const [tab, setTab] = useState<TabKey>('text');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [presets, setPresets] = useState<BlockDesignPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [weightDraft, setWeightDraft] = useState('400');

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!block) return;
    setDraftText(block.translatedText);
    setWeightDraft(String(block.fontWeight));
    setTab(block.submitted ? 'design' : 'text');
  }, [block?.id, visible]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      setPresetName('');
      return;
    }
    loadDesignPresets().then(setPresets);
  }, [visible]);

  const handleSavePreset = async () => {
    const name = presetName.trim();
    if (!name || !block) return;
    setSavingPreset(true);
    try {
      const next = await saveDesignPreset(name, designFromBlock(block));
      setPresets(next);
      setPresetName('');
      Keyboard.dismiss();
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = (preset: BlockDesignPreset) => {
    Alert.alert('Delete preset', `Remove "${preset.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = await deleteDesignPreset(preset.id);
          setPresets(next);
        },
      },
    ]);
  };

  if (!block) {
    return <Modal visible={false} transparent animationType="slide" />;
  }

  const editorTextStyle = buildMyanmarTextStyle(block, 1, 'editor');
  const previewText = draftText.trim() || block.translatedText.trim() || 'Enter translation to preview';
  const inputHeight = estimateTextInputHeight(block, draftText || block.translatedText || ' ');
  const previewHeight = estimateTextInputHeight(block, previewText);
  const canSubmit = draftText.trim().length > 0;
  const keyboardOpen = keyboardHeight > 0;
  const sheetBottom = Math.max(insets.bottom, keyboardOpen ? keyboardHeight : insets.bottom);

  const handleSubmit = () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    onChangeTranslation(draftText.trim());
    onSubmit();
  };

  const patchFontSize = (fontSize: number) => {
    onPatch({ fontSize, lineHeight: lineHeightForFontSize(fontSize) });
  };

  const commitWeightDraft = () => {
    const parsed = parseInt(weightDraft, 10);
    if (Number.isFinite(parsed)) {
      onPatch({ fontWeight: normalizeFontWeight(parsed) });
      setWeightDraft(String(normalizeFontWeight(parsed)));
    } else {
      setWeightDraft(String(block.fontWeight));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheetWrap, { marginBottom: sheetBottom }]}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Block #{block.id}</Text>
              <View style={styles.headerActions}>
                <Pressable onPress={onDelete}>
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
                <Pressable onPress={onClose}>
                  <Text style={styles.close}>Close</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={[styles.originalBox, keyboardOpen && styles.originalBoxCompact]}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.originalLabel}>Original</Text>
              <Text style={[styles.originalText, { fontFamily: NOTO_SANS_MYANMAR.regular, lineHeight: 22 }]}>
                {block.originalText || '(manual block)'}
              </Text>
            </ScrollView>

            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, tab === 'text' && styles.tabActive]}
                onPress={() => setTab('text')}
              >
                <Text style={[styles.tabText, tab === 'text' && styles.tabTextActive]}>Text</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, tab === 'design' && styles.tabActive]}
                onPress={() => setTab('design')}
              >
                <Text style={[styles.tabText, tab === 'design' && styles.tabTextActive]}>Design</Text>
              </Pressable>
            </View>

            <ScrollView
              style={[styles.tabScroll, keyboardOpen && styles.tabScrollCompact]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {tab === 'text' ? (
                <View style={styles.tabBody}>
                  <Text style={styles.label}>Translation (Burmese)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      keyboardOpen && styles.inputCompact,
                      editorTextStyle,
                      {
                        minHeight: keyboardOpen ? Math.min(inputHeight, 72) : inputHeight,
                        maxHeight: keyboardOpen ? 88 : Math.max(inputHeight, 160),
                      },
                    ]}
                    value={draftText}
                    onChangeText={setDraftText}
                    placeholder="Enter translation..."
                    placeholderTextColor="#999"
                    multiline
                    scrollEnabled
                    autoFocus={!block.submitted}
                    blurOnSubmit={false}
                  />

                  {!keyboardOpen && (
                    <>
                      <Text style={styles.label}>Preview on image</Text>
                      <View
                        style={[
                          styles.previewBox,
                          {
                            minHeight: previewHeight,
                            backgroundColor:
                              block.backgroundColor === 'transparent'
                                ? '#ffffff'
                                : block.backgroundColor,
                          },
                        ]}
                      >
                        <StrokedMyanmarText
                          block={block}
                          text={previewText}
                          mode="editor"
                          style={
                            !draftText.trim() && !block.translatedText.trim()
                              ? styles.previewPlaceholder
                              : undefined
                          }
                        />
                      </View>
                      <Text style={styles.hint}>
                        Submit to place text on the image. Then drag, resize, and rotate the box on
                        canvas.
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.tabBody}>
                  <Text style={styles.label}>Saved presets</Text>
                  {presets.length === 0 ? (
                    <Text style={styles.presetEmpty}>No presets yet — save your current design below.</Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.presetRow}
                      contentContainerStyle={styles.presetRowContent}
                    >
                      {presets.map((preset) => (
                        <Pressable
                          key={preset.id}
                          style={styles.presetChip}
                          onPress={() => {
                            const { id: _id, name: _name, ...style } = preset;
                            onPatch(style);
                          }}
                          onLongPress={() => handleDeletePreset(preset)}
                        >
                          <Text style={styles.presetChipText} numberOfLines={1}>
                            {preset.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.presetSaveRow}>
                    <TextInput
                      style={styles.presetNameInput}
                      value={presetName}
                      onChangeText={setPresetName}
                      placeholder="Preset name (e.g. Preset 1)"
                      placeholderTextColor="#999"
                    />
                    <Pressable
                      style={[
                        styles.presetSaveBtn,
                        (!presetName.trim() || savingPreset) && styles.presetSaveBtnDisabled,
                      ]}
                      onPress={handleSavePreset}
                      disabled={!presetName.trim() || savingPreset}
                    >
                      <Text style={styles.presetSaveBtnText}>Save</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.presetHint}>Long-press a preset to delete it.</Text>

              <StepRow
                label={`Font size (${block.fontSize}px)`}
                value={block.fontSize}
                onDecrease={() => patchFontSize(Math.max(MIN_FONT_SIZE, block.fontSize - 2))}
                onIncrease={() => patchFontSize(Math.min(MAX_FONT_SIZE, block.fontSize + 2))}
              />

              <StepRow
                label={`Line height (${block.lineHeight}px)`}
                value={block.lineHeight}
                onDecrease={() =>
                  onPatch({ lineHeight: Math.max(MIN_LINE_HEIGHT, block.lineHeight - 2) })
                }
                onIncrease={() =>
                  onPatch({ lineHeight: Math.min(MAX_LINE_HEIGHT, block.lineHeight + 2) })
                }
              />

              <Text style={styles.label}>Font weight</Text>
              <View style={styles.chipRow}>
                {(
                  [
                    [400, 'Regular'],
                    [500, 'Medium'],
                    [600, 'SemiBold'],
                    [700, 'Bold'],
                  ] as const
                ).map(([value, label]) => (
                  <ToggleChip
                    key={value}
                    label={label}
                    active={block.fontWeight === value}
                    onPress={() => {
                      onPatch({ fontWeight: value });
                      setWeightDraft(String(value));
                    }}
                  />
                ))}
              </View>
              <View style={styles.customWeightRow}>
                <Text style={styles.customWeightLabel}>Custom</Text>
                <TextInput
                  style={styles.customWeightInput}
                  value={weightDraft}
                  onChangeText={setWeightDraft}
                  keyboardType="number-pad"
                  maxLength={3}
                  onBlur={commitWeightDraft}
                  onSubmitEditing={commitWeightDraft}
                />
                <Text style={styles.customWeightHint}>100–900</Text>
              </View>

              <Text style={styles.label}>Font style</Text>
              <View style={styles.chipRow}>
                {(['normal', 'italic'] as FontStyleOption[]).map((value) => (
                  <ToggleChip
                    key={value}
                    label={value === 'normal' ? 'Normal' : 'Italic'}
                    active={block.fontStyle === value}
                    onPress={() => onPatch({ fontStyle: value })}
                  />
                ))}
              </View>

              <Text style={styles.label}>Text align</Text>
              <View style={styles.chipRow}>
                {(['left', 'center', 'right'] as TextAlign[]).map((value) => (
                  <ToggleChip
                    key={value}
                    label={value.charAt(0).toUpperCase() + value.slice(1)}
                    active={block.textAlign === value}
                    onPress={() => onPatch({ textAlign: value })}
                  />
                ))}
              </View>

              <Text style={styles.label}>Decoration</Text>
              <View style={styles.chipRow}>
                {(
                  [
                    ['none', 'None'],
                    ['underline', 'Underline'],
                    ['line-through', 'Strike'],
                  ] as const
                ).map(([value, label]) => (
                  <ToggleChip
                    key={value}
                    label={label}
                    active={block.textDecorationLine === value}
                    onPress={() => onPatch({ textDecorationLine: value as TextDecorationOption })}
                  />
                ))}
              </View>

              <StepRow
                label={`Letter spacing (${block.letterSpacing})`}
                value={block.letterSpacing}
                onDecrease={() => onPatch({ letterSpacing: block.letterSpacing - 0.5 })}
                onIncrease={() => onPatch({ letterSpacing: block.letterSpacing + 0.5 })}
              />

              <StepRow
                label={`Rotation (${block.rotation}°)`}
                value={block.rotation}
                onDecrease={() =>
                  onPatch({ rotation: Math.max(MIN_ROTATION, block.rotation - 5) })
                }
                onIncrease={() =>
                  onPatch({ rotation: Math.min(MAX_ROTATION, block.rotation + 5) })
                }
              />

              <Text style={styles.label}>Text outline</Text>
              <View style={styles.chipRow}>
                <ToggleChip
                  label={block.borderEnabled ? 'On' : 'Off'}
                  active={block.borderEnabled}
                  onPress={() => onPatch({ borderEnabled: !block.borderEnabled })}
                />
              </View>
              {block.borderEnabled && (
                <>
                  <StepRow
                    label={`Outline size (${block.borderWidth}px)`}
                    value={block.borderWidth}
                    onDecrease={() =>
                      onPatch({
                        borderWidth: Math.max(MIN_BORDER_WIDTH, block.borderWidth - 1),
                      })
                    }
                    onIncrease={() =>
                      onPatch({
                        borderWidth: Math.min(MAX_BORDER_WIDTH, block.borderWidth + 1),
                      })
                    }
                  />
                  <Text style={styles.label}>Outline color</Text>
                  <ColorWheelPicker
                    value={block.borderColor}
                    onChange={(borderColor) => onPatch({ borderColor })}
                  />
                  <View style={styles.swatchRow}>
                    {BORDER_COLOR_PRESETS.map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        selected={block.borderColor === color}
                        onPress={() => onPatch({ borderColor: color })}
                      />
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>Text color</Text>
              <ColorWheelPicker
                value={block.textColor}
                onChange={(textColor) => onPatch({ textColor })}
              />
              <View style={styles.swatchRow}>
                {TEXT_COLOR_PRESETS.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={block.textColor === color}
                    onPress={() => onPatch({ textColor: color })}
                  />
                ))}
              </View>

              <Text style={styles.label}>Background</Text>
              <ColorWheelPicker
                value={block.backgroundColor}
                onChange={(backgroundColor) => onPatch({ backgroundColor })}
                allowTransparent
              />
              <View style={styles.swatchRow}>
                {BACKGROUND_COLOR_PRESETS.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={block.backgroundColor === color}
                    label={color === 'transparent' ? 'Transparent' : color}
                    onPress={() => onPatch({ backgroundColor: color })}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

            {tab === 'text' && (
              <Pressable
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <Text style={styles.submitBtnText}>
                  {block.submitted ? 'Update text' : 'Submit translation'}
                </Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    maxHeight: 520,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4a90d9',
  },
  delete: {
    color: '#dc3545',
    fontWeight: '600',
  },
  close: {
    color: '#6c757d',
    fontWeight: '600',
  },
  originalBox: {
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    maxHeight: 72,
  },
  originalBoxCompact: {
    maxHeight: 48,
  },
  originalLabel: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '700',
    marginBottom: 4,
  },
  originalText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#eef1f4',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
  },
  tabTextActive: {
    color: '#4a90d9',
  },
  tabScroll: {
    flexGrow: 0,
    maxHeight: 400,
  },
  tabScrollCompact: {
    maxHeight: 96,
  },
  tabBody: {
    paddingBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 6,
    marginTop: 4,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    color: '#adb5bd',
    marginTop: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e6ea',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  inputCompact: {
    paddingVertical: 8,
  },
  previewBox: {
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 4,
    justifyContent: 'center',
  },
  previewText: {
    width: '100%',
  },
  previewPlaceholder: {
    color: '#adb5bd',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepRow: {
    marginBottom: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#4a90d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  stepValue: {
    minWidth: 36,
    textAlign: 'center',
    fontWeight: '700',
    color: '#343a40',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#eef1f4',
  },
  chipActive: {
    backgroundColor: '#4a90d9',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  chipTextActive: {
    color: '#fff',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  swatch: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#4a90d9',
  },
  swatchInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  swatchTransparent: {
    backgroundColor: '#fff',
    borderStyle: 'dashed',
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#4a90d9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  presetEmpty: {
    fontSize: 11,
    color: '#adb5bd',
    marginBottom: 8,
  },
  presetRow: {
    marginBottom: 8,
    flexGrow: 0,
  },
  presetRowContent: {
    gap: 8,
    paddingRight: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e8f2fc',
    borderWidth: 1,
    borderColor: '#4a90d9',
    maxWidth: 140,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a90d9',
  },
  presetSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  presetNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e6ea',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  presetSaveBtn: {
    backgroundColor: '#198754',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  presetSaveBtnDisabled: {
    opacity: 0.45,
  },
  presetSaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  presetHint: {
    fontSize: 10,
    color: '#adb5bd',
    marginBottom: 8,
  },
  customWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customWeightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  customWeightInput: {
    width: 64,
    borderWidth: 1,
    borderColor: '#e2e6ea',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: '#343a40',
  },
  customWeightHint: {
    fontSize: 11,
    color: '#adb5bd',
  },
});
