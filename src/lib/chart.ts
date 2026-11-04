import type { Gender } from './types';

export type SizeLookupResult =
  | { status: 'ok'; usMen: number; usWomen: number; ukMen: number; ukWomen: number; betweenSizes: boolean }
  | { status: 'below-range' }
  | { status: 'above-range' };

type SizeRow = [minMm: number, usMen: number, usWomen: number, ukMen: number, ukWomen: number];

const BETWEEN_SIZES_THRESHOLD_MM = 4;
const MIN_CHART_MM = 228;
const ABOVE_RANGE_MM = 306;

const CHART: SizeRow[] = [
  [228, 6, 7.5, 5, 5],
  [235, 6.5, 8, 5.5, 5.5],
  [241, 7, 8.5, 6, 6],
  [248, 7.5, 9, 6.5, 6.5],
  [254, 8, 9.5, 7, 7],
  [260, 9, 10, 8, 7.5],
  [267, 9.5, 10.5, 8.5, 8],
  [273, 10, 11, 9, 8.5],
  [279, 10.5, 11.5, 9.5, 9],
  [286, 11.5, 12, 10.5, 9.5],
  [294, 12.5, 13, 11.5, 10.5],
  [302, 13, 13.5, 12.5, 11],
];

export function lookupSize(lengthMm: number): SizeLookupResult {
  if (lengthMm < MIN_CHART_MM) return { status: 'below-range' };
  if (lengthMm >= ABOVE_RANGE_MM) return { status: 'above-range' };

  let rowIndex = 0;
  for (let i = 0; i < CHART.length; i += 1) {
    if (CHART[i][0] <= lengthMm) rowIndex = i;
  }
  const row = CHART[rowIndex];
  const nextRow = CHART[rowIndex + 1];
  const betweenSizes = nextRow !== undefined && nextRow[0] - lengthMm <= BETWEEN_SIZES_THRESHOLD_MM;

  return {
    status: 'ok',
    usMen: row[1],
    usWomen: row[2],
    ukMen: row[3],
    ukWomen: row[4],
    betweenSizes,
  };
}

export function sizesForGender(
  result: Extract<SizeLookupResult, { status: 'ok' }>,
  gender: Gender,
): { us: number; uk: number } {
  return gender === 'men'
    ? { us: result.usMen, uk: result.ukMen }
    : { us: result.usWomen, uk: result.ukWomen };
}

export function formatSize(size: number): string {
  return Number.isInteger(size) ? String(size) : size.toFixed(1);
}
