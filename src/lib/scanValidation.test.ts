import { describe, expect, it } from 'vitest';
import { compareViewLengths, isPlausibleWidth } from './scanValidation';

describe('isPlausibleWidth', () => {
  it('rejects a width below 30% of a valid adult length', () => {
    expect(isPlausibleWidth(77.9, 260)).toBe(false);
  });

  it('accepts a width at exactly 30% of a valid adult length', () => {
    expect(isPlausibleWidth(78, 260)).toBe(true);
  });

  it('accepts a width at exactly 50% of a valid adult length', () => {
    expect(isPlausibleWidth(130, 260)).toBe(true);
  });

  it('rejects a width above 50% of a valid adult length', () => {
    expect(isPlausibleWidth(132.7, 260)).toBe(false);
  });

  it('rejects width checks when the length itself is implausible', () => {
    expect(isPlausibleWidth(90, 400)).toBe(false);
  });

  it('rejects a width above the absolute maximum even when the ratio passes', () => {
    expect(isPlausibleWidth(165, 350)).toBe(false);
  });
});

describe('compareViewLengths', () => {
  it('averages readings whose difference is at most 5 mm', () => {
    expect(compareViewLengths(260, 264)).toEqual({ status: 'matching', lengthMm: 262 });
  });

  it('treats exactly 5.0 mm apart readings as matching', () => {
    expect(compareViewLengths(260, 265)).toEqual({ status: 'matching', lengthMm: 262.5 });
  });

  it('rounds the averaged reading to 0.1 mm', () => {
    expect(compareViewLengths(260.04, 264.06)).toEqual({ status: 'matching', lengthMm: 262.1 });
  });

  it('reports a mismatch when the difference is greater than 5 mm', () => {
    expect(compareViewLengths(260, 265.1)).toEqual({ status: 'mismatch', differenceMm: 5.1 });
  });
});
