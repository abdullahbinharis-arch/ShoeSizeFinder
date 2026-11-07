import { describe, expect, it } from 'vitest';
import { advanceArScan, initialArScanSnapshot } from './arScan';

function readyScan() {
  return advanceArScan(initialArScanSnapshot, { type: 'floor-ready' }).snapshot;
}

describe('advanceArScan', () => {
  it('starts in floor detection and advances to the top view when the floor is ready', () => {
    expect(initialArScanSnapshot.state).toBe('floor-detect');
    const result = advanceArScan(initialArScanSnapshot, { type: 'floor-ready' });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('top-length');
    expect(result.snapshot.error).toBeNull();
  });

  it('ignores an event that is not valid in the current state', () => {
    const result = advanceArScan(initialArScanSnapshot, { type: 'skip-width' });
    expect(result.accepted).toBe(false);
    expect(result.snapshot).toEqual(initialArScanSnapshot);
    expect(result.measurement).toBeNull();
  });

  it('accepts a valid top-view length and requests optional width', () => {
    const result = advanceArScan(readyScan(), { type: 'top-length', lengthMm: 260 });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('top-width');
    expect(result.snapshot.topLengthMm).toBe(260);
  });

  it('rejects an implausible top-view length without changing state', () => {
    const before = readyScan();
    const result = advanceArScan(before, { type: 'top-length', lengthMm: 120 });
    expect(result.accepted).toBe(false);
    expect(result.snapshot.state).toBe('top-length');
    expect(result.snapshot.topLengthMm).toBeNull();
    expect(result.snapshot.error).toMatch(/doesn't look right/i);
  });

  it('accepts a plausible width and moves to the angled view', () => {
    const withLength = advanceArScan(readyScan(), { type: 'top-length', lengthMm: 260 }).snapshot;
    const result = advanceArScan(withLength, { type: 'width', widthMm: 100 });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('angled-length');
    expect(result.snapshot.widthMm).toBe(100);
  });

  it('rejects an implausible width without changing state', () => {
    const withLength = advanceArScan(readyScan(), { type: 'top-length', lengthMm: 260 }).snapshot;
    const result = advanceArScan(withLength, { type: 'width', widthMm: 60 });
    expect(result.accepted).toBe(false);
    expect(result.snapshot.state).toBe('top-width');
    expect(result.snapshot.widthMm).toBeNull();
    expect(result.snapshot.error).toMatch(/width doesn't look right/i);
  });

  it('allows width to be skipped after a valid top length', () => {
    const withLength = advanceArScan(readyScan(), { type: 'top-length', lengthMm: 260 }).snapshot;
    const result = advanceArScan(withLength, { type: 'skip-width' });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('angled-length');
    expect(result.snapshot.widthMm).toBeNull();
  });

  it('treats an angled reading during the width step as an implicit width skip', () => {
    const withLength = advanceArScan(readyScan(), { type: 'top-length', lengthMm: 260 }).snapshot;
    const result = advanceArScan(withLength, { type: 'angled-length', lengthMm: 264 });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('complete');
    expect(result.snapshot.widthMm).toBeNull();
    expect(result.measurement).toEqual({ lengthMm: 262, widthMm: undefined, source: 'ar' });
  });

  it('completes with the average when the angled reading matches within 5 mm', () => {
    let snapshot = readyScan();
    snapshot = advanceArScan(snapshot, { type: 'top-length', lengthMm: 260 }).snapshot;
    snapshot = advanceArScan(snapshot, { type: 'width', widthMm: 100 }).snapshot;
    const result = advanceArScan(snapshot, { type: 'angled-length', lengthMm: 264 });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('complete');
    expect(result.measurement).toEqual({ lengthMm: 262, widthMm: 100, source: 'ar' });
  });

  it('requests an angled retry when the first two readings disagree', () => {
    let snapshot = readyScan();
    snapshot = advanceArScan(snapshot, { type: 'top-length', lengthMm: 260 }).snapshot;
    const result = advanceArScan(snapshot, { type: 'angled-length', lengthMm: 265.1 });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('angled-retry');
    expect(result.snapshot.error).toMatch(/5.1 mm apart/i);
    expect(result.measurement).toBeNull();
  });

  it('completes from an angled retry when the retry matches the top reading', () => {
    let snapshot = readyScan();
    snapshot = advanceArScan(snapshot, { type: 'top-length', lengthMm: 260 }).snapshot;
    snapshot = advanceArScan(snapshot, { type: 'angled-length', lengthMm: 265.1 }).snapshot;
    const result = advanceArScan(snapshot, { type: 'angled-retry-length', lengthMm: 263 });
    expect(result.snapshot.state).toBe('complete');
    expect(result.measurement).toEqual({ lengthMm: 261.5, widthMm: undefined, source: 'ar' });
  });

  it('returns to a fresh top view when the angled retry still disagrees', () => {
    let snapshot = readyScan();
    snapshot = advanceArScan(snapshot, { type: 'top-length', lengthMm: 260 }).snapshot;
    snapshot = advanceArScan(snapshot, { type: 'width', widthMm: 100 }).snapshot;
    snapshot = advanceArScan(snapshot, { type: 'angled-length', lengthMm: 265.1 }).snapshot;
    const result = advanceArScan(snapshot, { type: 'angled-retry-length', lengthMm: 270 });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('top-length');
    expect(result.snapshot.topLengthMm).toBeNull();
    expect(result.snapshot.angledLengthMm).toBeNull();
    expect(result.snapshot.widthMm).toBeNull();
    expect(result.snapshot.error).toMatch(/retake the top view/i);
    expect(result.measurement).toBeNull();
  });

  it('restart-top clears the in-progress scan and returns to the top view', () => {
    let snapshot = readyScan();
    snapshot = advanceArScan(snapshot, { type: 'top-length', lengthMm: 260 }).snapshot;
    snapshot = advanceArScan(snapshot, { type: 'angled-length', lengthMm: 265.1 }).snapshot;
    const result = advanceArScan(snapshot, { type: 'restart-top' });
    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('top-length');
    expect(result.snapshot.topLengthMm).toBeNull();
    expect(result.snapshot.angledLengthMm).toBeNull();
    expect(result.snapshot.widthMm).toBeNull();
  });
});
