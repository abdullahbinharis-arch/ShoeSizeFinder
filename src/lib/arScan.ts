import { isPlausibleLength, roundToTenthMm } from './photoMeasure';
import { compareViewLengths, isPlausibleWidth } from './scanValidation';
import type { FootMeasurement } from './types';

export type ArScanState =
  | 'floor-detect'
  | 'top-length'
  | 'top-width'
  | 'angled-length'
  | 'angled-retry'
  | 'complete';

export interface ArScanSnapshot {
  state: ArScanState;
  topLengthMm: number | null;
  angledLengthMm: number | null;
  widthMm: number | null;
  error: string | null;
}

export type ArScanEvent =
  | { type: 'floor-ready' }
  | { type: 'restart-top' }
  | { type: 'skip-width' }
  | { type: 'top-length'; lengthMm: number }
  | { type: 'width'; widthMm: number }
  | { type: 'angled-length'; lengthMm: number }
  | { type: 'angled-retry-length'; lengthMm: number };

export interface ArScanTransition {
  snapshot: ArScanSnapshot;
  accepted: boolean;
  measurement: FootMeasurement | null;
}

export const initialArScanSnapshot: ArScanSnapshot = {
  state: 'floor-detect',
  topLengthMm: null,
  angledLengthMm: null,
  widthMm: null,
  error: null,
};

const INVALID_LENGTH_MESSAGE = "That length doesn't look right — tap the heel and longest toe again.";
const INVALID_WIDTH_MESSAGE = "That width doesn't look right — tap the two widest points again.";

function reject(snapshot: ArScanSnapshot, error: string): ArScanTransition {
  return { snapshot: { ...snapshot, error }, accepted: false, measurement: null };
}

function accept(snapshot: ArScanSnapshot, patch: Partial<ArScanSnapshot>): ArScanTransition {
  return { snapshot: { ...snapshot, ...patch, error: patch.error ?? null }, accepted: true, measurement: null };
}

function completeScan(snapshot: ArScanSnapshot, lengthMm: number, angledLengthMm: number): ArScanTransition {
  return {
    snapshot: { ...snapshot, state: 'complete', angledLengthMm, error: null },
    accepted: true,
    measurement: {
      lengthMm,
      widthMm: snapshot.widthMm ?? undefined,
      source: 'ar',
    },
  };
}

function handleAngledLength(snapshot: ArScanSnapshot, lengthMm: number): ArScanTransition {
  if (!isPlausibleLength(lengthMm)) return reject(snapshot, INVALID_LENGTH_MESSAGE);
  if (snapshot.topLengthMm === null) return { snapshot, accepted: false, measurement: null };
  const comparison = compareViewLengths(snapshot.topLengthMm, lengthMm);
  if (comparison.status === 'matching') {
    return completeScan(snapshot, comparison.lengthMm, roundToTenthMm(lengthMm));
  }
  return accept(snapshot, {
    state: 'angled-retry',
    angledLengthMm: roundToTenthMm(lengthMm),
    error: `The two readings are ${comparison.differenceMm} mm apart — take one more from this angle.`,
  });
}

export function advanceArScan(snapshot: ArScanSnapshot, event: ArScanEvent): ArScanTransition {
  if (event.type === 'restart-top' && snapshot.state !== 'floor-detect' && snapshot.state !== 'complete') {
    return accept(initialArScanSnapshot, { state: 'top-length' });
  }

  switch (snapshot.state) {
    case 'floor-detect':
      if (event.type === 'floor-ready') {
        return accept(snapshot, { state: 'top-length' });
      }
      return { snapshot, accepted: false, measurement: null };

    case 'top-length':
      if (event.type !== 'top-length') return { snapshot, accepted: false, measurement: null };
      if (!isPlausibleLength(event.lengthMm)) return reject(snapshot, INVALID_LENGTH_MESSAGE);
      return accept(snapshot, { state: 'top-width', topLengthMm: roundToTenthMm(event.lengthMm) });

    case 'top-width': {
      if (event.type === 'skip-width') {
        return accept(snapshot, { state: 'angled-length' });
      }
      if (event.type === 'angled-length') {
        return handleAngledLength(snapshot, event.lengthMm);
      }
      if (event.type !== 'width') return { snapshot, accepted: false, measurement: null };
      if (snapshot.topLengthMm === null || !isPlausibleWidth(event.widthMm, snapshot.topLengthMm)) {
        return reject(snapshot, INVALID_WIDTH_MESSAGE);
      }
      return accept(snapshot, { state: 'angled-length', widthMm: roundToTenthMm(event.widthMm) });
    }

    case 'angled-length': {
      if (event.type !== 'angled-length') return { snapshot, accepted: false, measurement: null };
      return handleAngledLength(snapshot, event.lengthMm);
    }

    case 'angled-retry': {
      if (event.type !== 'angled-retry-length') return { snapshot, accepted: false, measurement: null };
      if (!isPlausibleLength(event.lengthMm)) return reject(snapshot, INVALID_LENGTH_MESSAGE);
      if (snapshot.topLengthMm === null) return { snapshot, accepted: false, measurement: null };
      const comparison = compareViewLengths(snapshot.topLengthMm, event.lengthMm);
      if (comparison.status === 'matching') {
        return completeScan(snapshot, comparison.lengthMm, roundToTenthMm(event.lengthMm));
      }
      return {
        snapshot: {
          ...initialArScanSnapshot,
          state: 'top-length',
          error: `Still ${comparison.differenceMm} mm apart — retake the top view.`,
        },
        accepted: true,
        measurement: null,
      };
    }

    case 'complete':
      return { snapshot, accepted: false, measurement: null };
  }
}
