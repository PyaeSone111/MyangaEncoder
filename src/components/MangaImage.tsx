import React from 'react';
import {
  Image,
  ImageProps,
  ImageSourcePropType,
  PixelRatio,
  Platform,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { getMangaImageProps } from '../utils/image';

interface Props {
  uri: string;
  imageWidth: number;
  imageHeight: number;
  layoutWidth: number;
  layoutHeight: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageProps['resizeMode'];
}

/** Gallery / canvas image with Android Fresco settings tuned for sharp manga display. */
export function MangaImage({
  uri,
  imageWidth,
  imageHeight,
  layoutWidth,
  layoutHeight,
  style,
  resizeMode = 'stretch',
}: Props) {
  const source: ImageSourcePropType = { uri };
  const androidProps = getMangaImageProps(imageWidth, imageHeight, layoutWidth, layoutHeight);

  return (
    <Image
      source={source}
      style={[{ width: layoutWidth, height: layoutHeight }, style]}
      resizeMode={resizeMode}
      {...androidProps}
    />
  );
}
