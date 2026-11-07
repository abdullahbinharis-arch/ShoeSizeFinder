import { isPlausibleLength, roundToTenthMm } from './photoMeasure';

export const MIN_WIDTH_MM = 70;
export const MAX_WIDTH_MM = 160;
export const MIN_WIDTH_RATIO = 0.3;
export const MAX_WIDTH_RATIO = 0.5;
export const MAX_VIEW_LENGTH_DIFFERENCE_MM = 5;

export function isPlausibleWidth(widthMm: number, lengthMm: number): boolean {
  if (!isPlausibleLength(lengthMm)) return false;
  const ratio = widthMm / lengthMm;
  return widthMm >= MIN_WIDTH_MM && widthMm <= MAX_WIDTH_MM && ratio >= MIN_WIDTH_RATIO && ratio <= MAX_WIDTH_RATIO;
}

export type LengthComparison =
  | { status: 'matching'; lengthMm: number }
  | { status: 'mismatch'; differenceMm: number };

export function compareViewLengths(topLengthMm: number, angledLengthMm: number): LengthComparison {
  const differenceMm = Math.abs(topLengthMm - angledLengthMm);
  if (differenceMm > MAX_VIEW_LENGTH_DIFFERENCE_MM) {
    return { status: 'mismatch', differenceMm: roundToTenthMm(differenceMm) };
  }
  return { status: 'matching', lengthMm: roundToTenthMm((topLengthMm + angledLengthMm) / 2) };
}
