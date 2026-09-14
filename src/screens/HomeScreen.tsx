import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, DetectedBlock } from '../types';
import { detectTextBlocks } from '../utils/ocr';
import { getImageSize } from '../utils/image';

const BACKGROUND = require('../../assets/bg.jpg');

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

async function requestGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permission =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const granted = await PermissionsAndroid.request(permission);
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const insets = useSafeAreaInsets();
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(contentTranslate, { toValue: 0, damping: 16, stiffness: 130, useNativeDriver: true }),
    ]).start();
  }, [contentOpacity, contentTranslate]);

  const pickImage = async () => {
    const allowed = await requestGalleryPermission();
    if (!allowed) {
      Alert.alert('Permission needed', 'Allow photo library access to upload images.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeExtra: true,
    });

    if (result.didCancel || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    const uri = asset.uri!;

    setLoading(true);
    setStatus('Reading image...');

    try {
      let width = asset.width ?? 0;
      let height = asset.height ?? 0;
      if (width <= 0 || height <= 0) {
        const size = await getImageSize(uri);
        width = size.width;
        height = size.height;
      }
      setStatus(height > 2200 ? 'Scanning long image...' : 'Detecting text...');

      let blocks: DetectedBlock[] = [];
      try {
        blocks = await detectTextBlocks(uri);
      } catch (ocrError) {
        console.warn('OCR failed, starting with empty text blocks', ocrError);
        Alert.alert(
          'OCR unavailable',
          'Text detection failed. You can still add text blocks manually with +.'
        );
      }

      navigation.navigate('Editor', {
        session: {
          imageUri: uri,
          imageWidth: width,
          imageHeight: height,
          blocks,
        },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process image.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <ImageBackground source={BACKGROUND} style={styles.container} resizeMode="cover">
      <Animated.View
        style={[styles.footer, { paddingBottom: insets.bottom + 28, opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }]}
      >
        <Text style={styles.subtitle}>Place your text and encode onto images</Text>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed, loading && styles.cardDisabled]}
          onPress={pickImage}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Upload an image from your gallery"
        >
          <Text style={styles.cardIcon}>↑</Text>
          <Text style={styles.cardTitle}>Tap to upload image</Text>
          <Text style={styles.cardHint}>PNG, JPG, WebP from gallery</Text>
        </Pressable>

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4a90d9" />
            <Text style={styles.loadingText}>{status}</Text>
          </View>
        )}
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#154370',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
    // textShadowColor: 'rgba(0, 0, 0, 0.45)',
    // textShadowOffset: { width: 0, height: 1 },
    // textShadowRadius: 4,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e6ea',
    borderRadius: 12,
    paddingVertical: 48,
    alignItems: 'center',
  },
  cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  cardDisabled: { opacity: 0.65 },
  cardIcon: {
    fontSize: 40,
    color: '#6c757d',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    color: '#212529',
  },
  cardHint: {
    fontSize: 13,
    color: '#6c757d',
  },
  loading: {
    marginTop: 24,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
