export type Gender = 'men' | 'women';
export type MeasureMethod = 'manual' | 'photo' | 'ar';
export type FootSide = 'left' | 'right';

export interface FootMeasurement {
  lengthMm: number;
  widthMm?: number;
  source: MeasureMethod;
}

export interface Point {
  x: number;
  y: number;
}

export type ToeShape = 'egyptian' | 'greek' | 'roman' | 'square';
export type WidthFeel = 'narrow' | 'normal' | 'wide';
export type ArchType = 'flat' | 'normal' | 'high';

export interface FootShape {
  toe: ToeShape;
  width: WidthFeel;
  arch: ArchType;
}
