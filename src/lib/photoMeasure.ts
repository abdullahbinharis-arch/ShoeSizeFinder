export const MIN_FOOT_MM = 150;
export const MAX_FOOT_MM = 350;

export function isPlausibleLength(mm: number): boolean {
  return mm >= MIN_FOOT_MM && mm <= MAX_FOOT_MM;
}

export function roundToTenthMm(mm: number): number {
  return Math.round(mm * 10) / 10;
}
