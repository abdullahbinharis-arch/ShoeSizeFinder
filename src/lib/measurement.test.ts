import { describe, expect, it } from 'vitest';
import { pxDistance, mmBetweenPoints } from './distance';
import { isPlausibleReference, MIN_REFERENCE_PX, pxPerMm, pxToMm } from './calibrate';
import { isPlausibleLength, MAX_FOOT_MM, MIN_FOOT_MM, roundToTenthMm } from './photoMeasure';
import { isArSupported } from './webxr';

describe('pxDistance', () => {
  it('computes euclidean distance', () => {
    expect(pxDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(pxDistance({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
  });
});

describe('mmBetweenPoints', () => {
  it('converts 3D world units (meters) to mm', () => {
    expect(mmBetweenPoints({ x: 0, y: 0, z: 0 }, { x: 0.264, y: 0, z: 0 })).toBeCloseTo(264, 5);
    expect(mmBetweenPoints({ x: 0, y: 0, z: 0 }, { x: 0.03, y: 0.04, z: 0 })).toBeCloseTo(50, 5);
  });
});

describe('calibrate', () => {
  it('derives px-per-mm from the credit card long edge (85.60 mm)', () => {
    expect(pxPerMm(171.2, 85.6)).toBeCloseTo(2, 5);
    expect(pxToMm(340, 2)).toBeCloseTo(170, 5);
  });
  it('rejects reference taps under 20 px apart', () => {
    expect(MIN_REFERENCE_PX).toBe(20);
    expect(isPlausibleReference(19.9)).toBe(false);
    expect(isPlausibleReference(20)).toBe(true);
    expect(isPlausibleReference(500)).toBe(true);
  });
});

describe('photoMeasure plausibility', () => {
  it('accepts 150–350 mm inclusive', () => {
    expect(MIN_FOOT_MM).toBe(150);
    expect(MAX_FOOT_MM).toBe(350);
    expect(isPlausibleLength(149.9)).toBe(false);
    expect(isPlausibleLength(150)).toBe(true);
    expect(isPlausibleLength(350)).toBe(true);
    expect(isPlausibleLength(350.1)).toBe(false);
  });
  it('rounds to a tenth of a mm', () => {
    expect(roundToTenthMm(264.06)).toBe(264.1);
    expect(roundToTenthMm(264.04)).toBe(264);
  });
});

describe('isArSupported', () => {
  it('resolves false when navigator.xr is absent (jsdom)', async () => {
    expect(await isArSupported()).toBe(false);
  });
});
