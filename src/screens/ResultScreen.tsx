import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  saveDocuments,
} from '@react-native-documents/picker';
import Share from 'react-native-share';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { MangaImage } from '../components/MangaImage';
import { encodedImageFileName, toFileUri } from '../utils/saveImage';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { imageUri, session } = route.params;
  const { width: screenWidth } = useWindowDimensions();
  const displayHeight = (session.imageHeight / session.imageWidth) * screenWidth;
  const [downloading, setDownloading] = useState(false);

  const downloadImage = async () => {
    setDownloading(true);
    try {
      const [result] = await saveDocuments({
        sourceUris: [toFileUri(imageUri)],
        mimeType: 'image/png',
        fileName: encodedImageFileName(),
        copy: true,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert(
        'Downloaded',
        result.name ? `Saved as ${result.name}` : 'Image saved to the location you selected.'
      );
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error(error);
      Alert.alert('Download failed', 'Could not save the image to the selected location.');
    } finally {
      setDownloading(false);
    }
  };

  const shareImage = async () => {
    try {
      await Share.open({ url: toFileUri(imageUri), type: 'image/png' });
    } catch (error) {
      if ((error as { message?: string })?.message !== 'User did not share') {
        console.error(error);
        Alert.alert('Share failed', 'Could not share image.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.toolbarBtn, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.toolbarBtnText}>←</Text>
        </Pressable>
        <Text style={styles.toolbarTitle} numberOfLines={1}>
          Encoded
        </Text>
        <View style={styles.toolbarSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <MangaImage
          uri={imageUri}
          imageWidth={session.imageWidth}
          imageHeight={session.imageHeight}
          layoutWidth={screenWidth}
          layoutHeight={displayHeight}
          resizeMode="contain"
        />
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.downloadBtn, pressed && styles.pressed, downloading && styles.actionBtnDisabled]}
          onPress={downloadImage}
          disabled={downloading}
          accessibilityRole="button"
          accessibilityLabel="Download image"
        >
          {downloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.downloadBtnText}>Download</Text>
          )}
        </Pressable>

        <Pressable style={({ pressed }) => [styles.actionBtn, styles.outlineBtn, pressed && styles.pressed]} onPress={shareImage}>
          <Text style={styles.outlineBtnText}>Share</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.actionBtn, styles.outlineBtn, pressed && styles.pressed]} onPress={() => navigation.popToTop()}>
          <Text style={styles.outlineBtnText}>New Image</Text>
        </Pressable>
      </View>
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
  toolbarSpacer: { width: 44 },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e6ea',
  },
  actionBtn: {
    flex: 1,
    minWidth: 92,
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  downloadBtn: {
    backgroundColor: '#198754',
  },
  downloadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  outlineBtn: {
    borderWidth: 2,
    borderColor: '#e2e6ea',
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    color: '#343a40',
  },
});
