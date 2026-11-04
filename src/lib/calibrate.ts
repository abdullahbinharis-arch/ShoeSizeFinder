export const MIN_REFERENCE_PX = 20;

export function isPlausibleReference(refPxDistance: number): boolean {
  return refPxDistance >= MIN_REFERENCE_PX;
}

export function pxPerMm(refPxDistance: number, refMm: number): number {
  return refPxDistance / refMm;
}

export function pxToMm(px: number, pxPerMmValue: number): number {
  return px / pxPerMmValue;
}
