export type TextAlign = 'left' | 'center' | 'right';
export type FontStyleOption = 'normal' | 'italic';
export type TextDecorationOption = 'none' | 'underline' | 'line-through';

/** Typography and color styling reusable across text blocks. */
export interface BlockDesignStyle {
  fontSize: number;
  lineHeight: number;
  textColor: string;
  backgroundColor: string;
  /** Numeric weight 100–900. */
  fontWeight: number;
  fontStyle: FontStyleOption;
  textAlign: TextAlign;
  letterSpacing: number;
  textDecorationLine: TextDecorationOption;
  borderEnabled: boolean;
  borderWidth: number;
  borderColor: string;
}

export interface BlockDesignPreset extends BlockDesignStyle {
  id: string;
  name: string;
}

/** Axis-aligned rectangle in original image pixel coordinates. */
export interface DetectedBlock {
  id: number;
  originalText: string;
  translatedText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  textColor: string;
  /** Hex color or `'transparent'` for no fill. */
  backgroundColor: string;
  /** Numeric weight 100–900. */
  fontWeight: number;
  fontStyle: FontStyleOption;
  textAlign: TextAlign;
  letterSpacing: number;
  textDecorationLine: TextDecorationOption;
  borderEnabled: boolean;
  borderWidth: number;
  borderColor: string;
  /** Rotation in degrees. */
  rotation: number;
  /** True after the user submits translation — enables canvas transforms. */
  submitted: boolean;
}

export interface EditorSession {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  blocks: DetectedBlock[];
}

export type RootStackParamList = {
  Home: undefined;
  Editor: { session: EditorSession };
  Result: { imageUri: string; session: EditorSession };
};
