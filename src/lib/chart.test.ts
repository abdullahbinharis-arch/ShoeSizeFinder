import { describe, expect, it } from 'vitest';
import { formatSize, lookupSize, sizesForGender } from './chart';

describe('lookupSize', () => {
  it('maps 260 mm to US men 9', () => {
    expect(lookupSize(260)).toEqual({
      status: 'ok', usMen: 9, usWomen: 10, ukMen: 8, ukWomen: 7.5, betweenSizes: false,
    });
  });

  it('maps every bracket minimum to its own row', () => {
    expect(lookupSize(228)).toMatchObject({ status: 'ok', usMen: 6 });
    expect(lookupSize(302)).toMatchObject({ status: 'ok', usMen: 13, ukWomen: 11 });
  });

  it('flags between-sizes when within 4 mm of the next bracket edge', () => {
    expect(lookupSize(232)).toMatchObject({ status: 'ok', usMen: 6, betweenSizes: true });
    expect(lookupSize(231)).toMatchObject({ betweenSizes: true });
    expect(lookupSize(230)).toMatchObject({ betweenSizes: false });
    expect(lookupSize(264)).toMatchObject({ status: 'ok', usMen: 9, betweenSizes: true });
  });

  it('returns below-range under 228 mm and above-range at 306 mm or more', () => {
    expect(lookupSize(227)).toEqual({ status: 'below-range' });
    expect(lookupSize(150)).toEqual({ status: 'below-range' });
    expect(lookupSize(306)).toEqual({ status: 'above-range' });
    expect(lookupSize(400)).toEqual({ status: 'above-range' });
  });
});

describe('sizesForGender', () => {
  const ok = lookupSize(260);
  it('returns men sizes for men', () => {
    expect(sizesForGender(ok as never, 'men')).toEqual({ us: 9, uk: 8 });
  });
  it('returns women sizes for women', () => {
    expect(sizesForGender(ok as never, 'women')).toEqual({ us: 10, uk: 7.5 });
  });
});

describe('formatSize', () => {
  it('formats whole and half sizes', () => {
    expect(formatSize(9)).toBe('9');
    expect(formatSize(9.5)).toBe('9.5');
    expect(formatSize(7.5)).toBe('7.5');
  });
});
