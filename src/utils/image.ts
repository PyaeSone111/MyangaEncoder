import { Image, ImageProps, PixelRatio, Platform } from 'react-native';

export function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type MangaImageAndroidProps = Pick<
  ImageProps,
  'resizeMethod' | 'resizeMultiplier' | 'fadeDuration' | 'progressiveRenderingEnabled'
>;

/**
 * Android Fresco defaults (`auto` → `resize`) aggressively downsample JPEGs, which
 * makes manga look soft. Pick a method based on how much we downscale for the view.
 */
export function getMangaImageProps(
  imageWidth: number,
  imageHeight: number,
  layoutWidth: number,
  layoutHeight: number
): MangaImageAndroidProps {
  if (Platform.OS !== 'android') {
    return {};
  }

  const pixelRatio = PixelRatio.get();
  const targetWidth = layoutWidth * pixelRatio;
  const targetHeight = layoutHeight * pixelRatio;
  const downscale = Math.max(imageWidth / targetWidth, imageHeight / targetHeight);

  const base: MangaImageAndroidProps = {
    fadeDuration: 0,
    progressiveRenderingEnabled: false,
  };

  // View is ~native resolution — skip downsampling entirely.
  if (downscale <= 1.08) {
    return { ...base, resizeMethod: 'none' };
  }

  // Moderate downscale — GPU scale keeps edges sharp.
  if (downscale <= 3) {
    return { ...base, resizeMethod: 'scale' };
  }

  // Heavy downscale (very wide image on narrow screen) — oversample then scale.
  return {
    ...base,
    resizeMethod: 'resize',
    resizeMultiplier: Math.min(3, Math.max(1.5, pixelRatio * 1.5)),
  };
}
