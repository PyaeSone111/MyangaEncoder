import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Video, { type OnLoadData } from 'react-native-video';

const SPLASH_VIDEO = require('../../assets/splash.mp4');
const LOGO = require('../../assets/logo.jpg');
const MAX_SPLASH_MS = 8000;
const VIDEO_START_TIMEOUT_MS = 2500;

interface Props {
  onFinish: () => void;
}

/**
 * Splash with logo fallback — never stays pure black if the video fails to load.
 */
export function VideoSplashScreen({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const finishedRef = useRef(false);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (maxTimer.current) clearTimeout(maxTimer.current);
    if (videoTimer.current) clearTimeout(videoTimer.current);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    maxTimer.current = setTimeout(finish, MAX_SPLASH_MS);
    videoTimer.current = setTimeout(() => {
      if (!videoReady) finish();
    }, VIDEO_START_TIMEOUT_MS);

    return () => {
      if (maxTimer.current) clearTimeout(maxTimer.current);
      if (videoTimer.current) clearTimeout(videoTimer.current);
    };
  }, [finish, videoReady]);

  const handleLoad = useCallback(
    (data: OnLoadData) => {
      setVideoReady(true);
      if (videoTimer.current) clearTimeout(videoTimer.current);
      const durationMs = Math.ceil((data.duration ?? 0) * 1000) + 400;
      if (maxTimer.current) clearTimeout(maxTimer.current);
      maxTimer.current = setTimeout(finish, Math.min(durationMs, MAX_SPLASH_MS));
    },
    [finish]
  );

  const handleVideoError = useCallback(() => {
    setVideoFailed(true);
    finish();
  }, [finish]);

  const logoWidth = Math.min(width - 48, 320);

  return (
    <Pressable style={styles.container} onPress={finish} accessibilityRole="button">
      <StatusBar hidden translucent backgroundColor="#f7f6f4" barStyle="dark-content" />

      <Image source={LOGO} style={{ width: logoWidth, height: logoWidth * 0.52 }} resizeMode="contain" />

      {!videoFailed && (
        <Video
          source={SPLASH_VIDEO}
          style={[styles.video, !videoReady && styles.videoHidden]}
          resizeMode="cover"
          repeat={false}
          muted={false}
          paused={false}
          controls={false}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          onLoad={handleLoad}
          onEnd={finish}
          onError={handleVideoError}
        />
      )}

      <View style={styles.footer}>
        {!videoReady && !videoFailed && <ActivityIndicator color="#4a90d9" size="small" />}
        <Text style={styles.skipText}>Tap to continue</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoHidden: {
    opacity: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 10,
  },
  skipText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
  },
});
