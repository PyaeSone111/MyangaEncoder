import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  MangaTranslationEditor,
  MangaTranslationEditorHandle,
} from '../components/MangaTranslationEditor';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

export function EditorScreen({ navigation, route }: Props) {
  const { session } = route.params;
  const editorRef = useRef<MangaTranslationEditorHandle>(null);
  const [busy, setBusy] = useState(false);

  const saveCompiledImage = async () => {
    Keyboard.dismiss();
    const blocks = editorRef.current?.getBlocks() ?? [];
    const hasTranslation = blocks.some((b) => b.submitted && b.translatedText.trim());

    if (!hasTranslation) {
      Alert.alert('No translation', 'Submit at least one translated text block before saving.');
      return;
    }

    setBusy(true);
    try {
      const imageUri = await editorRef.current!.capture();
      navigation.navigate('Result', {
        imageUri,
        session: { ...session, blocks: editorRef.current!.getBlocks() },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Export failed', 'Could not compile the final image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.toolbarBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.toolbarBtnText}>←</Text>
        </Pressable>
        <Text style={styles.toolbarTitle} numberOfLines={1}>
          Translation Editor
        </Text>
        <Pressable
          onPress={saveCompiledImage}
          style={[styles.saveBtn, busy && styles.disabled]}
          disabled={busy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Save compiled image"
        >
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <MangaTranslationEditor
        ref={editorRef}
        imageUri={session.imageUri}
        imageWidth={session.imageWidth}
        imageHeight={session.imageHeight}
        initialBlocks={session.blocks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  toolbar: {
    minHeight: 52,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e6ea',
    zIndex: 100,
    elevation: 12,
  },
  toolbarBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarBtnText: { fontSize: 22 },
  toolbarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  saveBtn: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 76,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
