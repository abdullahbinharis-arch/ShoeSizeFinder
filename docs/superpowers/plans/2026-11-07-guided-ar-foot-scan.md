# Guided AR Foot Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided, reference-free two-angle WebXR foot scan for supported Android devices.

**Architecture:** A pure validation module checks adult length/width bounds and compares top/angled readings. A pure state machine owns scan progression and produces `FootMeasurement`. A presentational overlay renders the face-verification-style guide. `ArMeasureStep` owns WebXR/Three.js and forwards measured distances into the state machine. `WelcomeStep` promotes the scan only when AR is supported.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, Three.js, WebXR.

## Global Constraints

- Add no dependencies; use the existing React/TypeScript/Three/Vitest stack.
- Supported path must require no A4 paper, card, or other external reference.
- Two length readings agree when their absolute difference is **≤ 5 mm**; matching readings are averaged and rounded to 0.1 mm.
- Adult length validation remains **150–350 mm** through `isPlausibleLength`.
- Width validation must be independent of foot-length validation: absolute bounds **70–160 mm**, width/length ratio **0.30–0.50**.
- The result must remain `{ lengthMm, widthMm?, source: 'ar' }`.
- All camera data and measured coordinates stay on the device.
- On AR-supported devices, hide the card-referenced photo option; show `Scan my foot` primary and `Type my measurement` secondary.
- On unsupported devices, keep `Type my measurement` primary and `Take a photo` secondary.
- Run `npm test` and `npm run build` after implementation; both must pass before any success claim.

## File Structure

- Create: `src/lib/scanValidation.ts` — pure width checks and two-angle length comparison.
- Test: `src/lib/scanValidation.test.ts`
- Create: `src/lib/arScan.ts` — pure scan snapshot, events, transitions, and final measurement.
- Test: `src/lib/arScan.test.ts`
- Create: `src/components/ArScanOverlay.tsx` — foot outline, view label, instructions, error, and progress dots.
- Test: `src/components/ArScanOverlay.test.tsx`
- Modify: `src/components/WelcomeStep.tsx` — supported-device primary scan and fallbacks.
- Test: `src/components/WelcomeStep.test.tsx` (new) and `src/App.test.tsx`
- Modify: `src/components/ArMeasureStep.tsx` — guided WebXR scan integration.
- Test: `src/components/ArMeasureStep.test.tsx`
- Modify: `src/styles.css` — AR stage and overlay styles.

---

### Task 1: Width and Two-Angle Comparison Validation

**Files:**
- Create: `src/lib/scanValidation.ts`
- Test: `src/lib/scanValidation.test.ts`

**Interfaces:**
- Consumes: `isPlausibleLength` and `roundToTenthMm` from `src/lib/photoMeasure.ts`
- Produces:
  - `MAX_VIEW_LENGTH_DIFFERENCE_MM: 5`
  - `isPlausibleWidth(widthMm: number, lengthMm: number): boolean`
  - `compareViewLengths(topLengthMm: number, angledLengthMm: number): { status: 'matching'; lengthMm: number } | { status: 'mismatch'; differenceMm: number }`

- [ ] **Step 1: Write the failing test**

```ts
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
});

describe('compareViewLengths', () => {
  it('averages readings whose difference is at most 5 mm', () => {
    expect(compareViewLengths(260, 264)).toEqual({ status: 'matching', lengthMm: 262 });
  });

  it('rounds the averaged reading to 0.1 mm', () => {
    expect(compareViewLengths(260.04, 264.06)).toEqual({ status: 'matching', lengthMm: 262.1 });
  });

  it('reports a mismatch when the difference is greater than 5 mm', () => {
    expect(compareViewLengths(260, 265.1)).toEqual({ status: 'mismatch', differenceMm: 5.1 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/scanValidation.test.ts`
Expected: FAIL with `Cannot find module './scanValidation'`

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/scanValidation.test.ts`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/scanValidation.ts src/lib/scanValidation.test.ts
git commit -m "feat: add AR scan measurement validation"
```

---

### Task 2: Pure AR Scan State Machine

**Files:**
- Create: `src/lib/arScan.ts`
- Test: `src/lib/arScan.test.ts`

**Interfaces:**
- Consumes:
  - `compareViewLengths`, `isPlausibleWidth` from `./scanValidation`
  - `isPlausibleLength`, `roundToTenthMm` from `./photoMeasure`
  - `FootMeasurement` from `./types`
- Produces:
  - `ArScanState`, `ArScanSnapshot`, `ArScanEvent`, `ArScanTransition`
  - `initialArScanSnapshot`
  - `advanceArScan(snapshot: ArScanSnapshot, event: ArScanEvent): ArScanTransition`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/arScan.test.ts`
Expected: FAIL with `Cannot find module './arScan'`

- [ ] **Step 3: Write minimal implementation**

```ts
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
      if (event.type !== 'width') return { snapshot, accepted: false, measurement: null };
      if (snapshot.topLengthMm === null || !isPlausibleWidth(event.widthMm, snapshot.topLengthMm)) {
        return reject(snapshot, INVALID_WIDTH_MESSAGE);
      }
      return accept(snapshot, { state: 'angled-length', widthMm: roundToTenthMm(event.widthMm) });
    }

    case 'angled-length': {
      if (event.type !== 'angled-length') return { snapshot, accepted: false, measurement: null };
      if (!isPlausibleLength(event.lengthMm)) return reject(snapshot, INVALID_LENGTH_MESSAGE);
      if (snapshot.topLengthMm === null) return { snapshot, accepted: false, measurement: null };
      const comparison = compareViewLengths(snapshot.topLengthMm, event.lengthMm);
      if (comparison.status === 'matching') {
        return completeScan(snapshot, comparison.lengthMm, roundToTenthMm(event.lengthMm));
      }
      return accept(snapshot, {
        state: 'angled-retry',
        angledLengthMm: roundToTenthMm(event.lengthMm),
        error: `The two readings are ${comparison.differenceMm} mm apart — take one more from this angle.`,
      });
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/arScan.test.ts`
Expected: PASS, 12 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/arScan.ts src/lib/arScan.test.ts
git commit -m "feat: add guided AR scan state machine"
```

---

### Task 3: AR Scan Overlay Component

**Files:**
- Create: `src/components/ArScanOverlay.tsx`
- Test: `src/components/ArScanOverlay.test.tsx`

**Interfaces:**
- Consumes: `ArScanState` from `../lib/arScan`
- Produces: `ArScanOverlay({ state, error }: { state: ArScanState; error?: string | null })`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { ArScanOverlay } from './ArScanOverlay';

test('floor detection shows the first progress step and movement instruction', () => {
  const { container } = render(<ArScanOverlay state="floor-detect" />);
  expect(screen.getByText('Find the floor')).toBeInTheDocument();
  expect(screen.getByText(/move your phone slowly/i)).toBeInTheDocument();
  const dots = container.querySelectorAll('.scan-progress-dot');
  expect(dots).toHaveLength(4);
  expect(dots[0]).toHaveClass('active');
});

test('top view shows the foot-outline instruction and marks floor detection complete', () => {
  const { container } = render(<ArScanOverlay state="top-length" />);
  expect(screen.getByText('Top view')).toBeInTheDocument();
  expect(screen.getByText(/tap your heel/i)).toBeInTheDocument();
  expect(container.querySelector('.scan-foot-outline')).not.toBeNull();
  const dots = container.querySelectorAll('.scan-progress-dot');
  expect(dots[0]).toHaveClass('done');
  expect(dots[1]).toHaveClass('active');
});

test('angled retry shows its instruction and the state-machine error', () => {
  render(<ArScanOverlay state="angled-retry" error="The two readings are 7 mm apart" />);
  expect(screen.getByText('One more check')).toBeInTheDocument();
  expect(screen.getByText(/tap heel and toe once more/i)).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('The two readings are 7 mm apart');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ArScanOverlay.test.tsx`
Expected: FAIL with `Cannot find module './ArScanOverlay'`

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { ArScanState } from '../lib/arScan';

interface ArScanOverlayProps {
  state: ArScanState;
  error?: string | null;
}

const VIEW_LABELS: Record<ArScanState, string> = {
  'floor-detect': 'Find the floor',
  'top-length': 'Top view',
  'top-width': 'Optional width',
  'angled-length': '45° view',
  'angled-retry': 'One more check',
  complete: 'All set',
};

const INSTRUCTIONS: Record<ArScanState, string> = {
  'floor-detect': 'Move your phone slowly until the floor is detected.',
  'top-length': 'Tap your heel, then the tip of your longest toe.',
  'top-width': 'Tap the two widest points of your foot.',
  'angled-length': 'Move to the side, then tap heel and toe again.',
  'angled-retry': 'Keep this angle and tap heel and toe once more.',
  complete: 'Your measurement is ready.',
};

const STEP_INDEX: Record<ArScanState, number> = {
  'floor-detect': 0,
  'top-length': 1,
  'top-width': 2,
  'angled-length': 3,
  'angled-retry': 3,
  complete: 3,
};

export function ArScanOverlay({ state, error }: ArScanOverlayProps) {
  const activeStep = STEP_INDEX[state];

  return (
    <div className="ar-scan-overlay" aria-live="polite">
      <div className="scan-view-badge">{VIEW_LABELS[state]}</div>
      <svg className="scan-foot-outline" viewBox="0 0 120 260" aria-hidden="true">
        <path d="M60 18 C79 20 91 38 92 62 C93 90 84 112 82 139 C80 173 91 199 83 226 C77 247 43 247 37 226 C29 199 40 173 38 139 C36 112 27 90 28 62 C29 38 41 20 60 18 Z" />
      </svg>
      <div className="scan-instruction-block">
        <p className="scan-instruction">{INSTRUCTIONS[state]}</p>
        {error ? <p className="scan-error" role="alert">{error}</p> : null}
      </div>
      <div className="scan-progress" aria-label={`Scan progress: step ${activeStep + 1} of 4`}>
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className={`scan-progress-dot${step === activeStep ? ' active' : step < activeStep ? ' done' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ArScanOverlay.test.tsx`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/ArScanOverlay.tsx src/components/ArScanOverlay.test.tsx
git commit -m "feat: add guided AR scan overlay"
```

---

### Task 4: Promote AR Scan on Supported Devices

**Files:**
- Modify: `src/components/WelcomeStep.tsx`
- Create Test: `src/components/WelcomeStep.test.tsx`
- Modify Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: existing `arSupported: boolean` and `onSelect(method: MeasureMethod)` props
- Produces: no new exports; visible button names are `Scan my foot`, `Type my measurement`, and `Take a photo`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeStep } from './WelcomeStep';

test('supported devices show Scan my foot first and hide the card-referenced photo option', () => {
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  expect(screen.getByRole('button', { name: 'Scan my foot' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Type my measurement' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Take a photo' })).not.toBeInTheDocument();
});

test('unsupported devices keep type-in primary and photo as fallback', () => {
  render(<WelcomeStep arSupported={false} onSelect={() => {}} />);

  expect(screen.getByRole('button', { name: 'Type my measurement' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Take a photo' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Scan my foot' })).not.toBeInTheDocument();
});

test('clicking Scan my foot selects the AR method', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  await user.click(screen.getByRole('button', { name: 'Scan my foot' }));
  expect(onSelect).toHaveBeenCalledWith('ar');
});
```

Add this test to `src/App.test.tsx` after the existing tests, and add `afterEach(() => vi.unstubAllGlobals());` beneath the imports:

```tsx
test('welcome promotes AR and hides photo when navigator.xr supports immersive-ar', async () => {
  const xr = { isSessionSupported: vi.fn().mockResolvedValue(true) };
  vi.stubGlobal('navigator', { ...navigator, xr });

  render(<App />);

  expect(await screen.findByRole('button', { name: 'Scan my foot' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Type my measurement' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Take a photo' })).not.toBeInTheDocument();
  vi.unstubAllGlobals();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/WelcomeStep.test.tsx src/App.test.tsx`
Expected: FAIL because `WelcomeStep.test.tsx` cannot be found and supported devices still show `Take a photo`

- [ ] **Step 3: Write minimal implementation**

Replace the body of `WelcomeStep.tsx`:

```tsx
import type { MeasureMethod } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface WelcomeStepProps {
  arSupported: boolean;
  onSelect: (method: MeasureMethod) => void;
}

export function WelcomeStep({ arSupported, onSelect }: WelcomeStepProps) {
  return (
    <StepShell
      title="Find your true shoe size"
      subtitle={arSupported ? 'Scan your foot with your phone — no card or paper needed.' : 'Measure your foot in under a minute.'}
    >
      {arSupported ? (
        <PrimaryButton onClick={() => onSelect('ar')}>Scan my foot</PrimaryButton>
      ) : (
        <PrimaryButton onClick={() => onSelect('manual')}>Type my measurement</PrimaryButton>
      )}
      {arSupported ? (
        <button type="button" className="btn-secondary" onClick={() => onSelect('manual')}>
          Type my measurement
        </button>
      ) : (
        <button type="button" className="btn-secondary" onClick={() => onSelect('photo')}>
          Take a photo
        </button>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/WelcomeStep.test.tsx src/App.test.tsx`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/WelcomeStep.tsx src/components/WelcomeStep.test.tsx src/App.test.tsx
git commit -m "feat: promote guided AR scan on supported devices"
```

---

### Task 5: Guided WebXR Measurement Step

**Files:**
- Modify: `src/components/ArMeasureStep.tsx`
- Modify Test: `src/components/ArMeasureStep.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes:
  - `advanceArScan`, `initialArScanSnapshot`, `ArScanEvent`, `ArScanSnapshot` from `../lib/arScan`
  - `ArScanOverlay`
  - `mmBetweenPoints` from `../lib/distance`
  - `roundToTenthMm` from `../lib/photoMeasure`
  - existing `requestArSession` and `hitTestSourceFromSession` helpers
- Produces: same public props as before — no caller changes in `App.tsx`

- [ ] **Step 1: Write the failing test**

Replace `src/components/ArMeasureStep.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArMeasureStep from './ArMeasureStep';

test('shows starting state, then failure UI when the session cannot start', async () => {
  const user = userEvent.setup();
  const onFailed = vi.fn();
  render(<ArMeasureStep onFailed={onFailed} onComplete={() => {}} />);
  expect(screen.getByText(/starting AR/i)).toBeInTheDocument();
  expect(await screen.findByText(/couldn't start AR/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /try typing your measurement/i }));
  expect(onFailed).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ArMeasureStep.test.tsx`
Expected: FAIL because the fallback button still says `Back`

- [ ] **Step 3: Write minimal implementation**

Replace `src/components/ArMeasureStep.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { advanceArScan, initialArScanSnapshot } from '../lib/arScan';
import type { ArScanEvent, ArScanSnapshot } from '../lib/arScan';
import { mmBetweenPoints } from '../lib/distance';
import { roundToTenthMm } from '../lib/photoMeasure';
import { hitTestSourceFromSession, requestArSession } from '../lib/webxr';
import type { FootMeasurement } from '../lib/types';
import { ArScanOverlay } from './ArScanOverlay';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

type StartupPhase = 'starting' | 'ready' | 'failed';

interface ArMeasureStepProps {
  onFailed: () => void;
  onComplete: (measurement: FootMeasurement) => void;
}

const LENGTH_STATES: ArScanSnapshot['state'][] = ['top-length', 'angled-length', 'angled-retry'];

export default function ArMeasureStep({ onFailed, onComplete }: ArMeasureStepProps) {
  const [startup, setStartup] = useState<StartupPhase>('starting');
  const [scan, setScan] = useState<ArScanSnapshot>(initialArScanSnapshot);
  const holderRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef(scan);
  const pendingRef = useRef<THREE.Vector3[]>([]);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    scanRef.current = scan;
  }, [scan]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearPending = () => {
    pendingRef.current = [];
    markerGroupRef.current?.clear();
  };

  const applyEvent = (event: ArScanEvent) => {
    const transition = advanceArScan(scanRef.current, event);
    scanRef.current = transition.snapshot;
    setScan(transition.snapshot);
    if (transition.accepted) clearPending();
    if (transition.measurement) onCompleteRef.current(transition.measurement);
  };

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let session: XRSession | null = null;
    let onSelect: (() => void) | null = null;

    (async () => {
      session = await requestArSession();
      const hitSource = session ? await hitTestSourceFromSession(session) : null;
      if (disposed) {
        if (session) void session.end();
        return;
      }
      if (!session || !hitSource || !holderRef.current) {
        if (session) void session.end();
        setStartup('failed');
        return;
      }

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);

        const width = holderRef.current.clientWidth || window.innerWidth;
        const height = Math.min(window.innerHeight * 0.6, 420);
        renderer.setSize(width, height);
        renderer.xr.enabled = true;
        holderRef.current.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        camera.matrixAutoUpdate = false;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        const reticle = new THREE.Mesh(
          new THREE.RingGeometry(0.04, 0.05, 32).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0x00e0c6 }),
        );
        reticle.visible = false;
        scene.add(reticle);

        const markerGroup = new THREE.Group();
        scene.add(markerGroup);
        markerGroupRef.current = markerGroup;

        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
        const addMarker = (point: THREE.Vector3) => {
          const marker = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 16), markerMaterial);
          marker.position.copy(point);
          markerGroup.add(marker);
        };

        await renderer.xr.setSession(session);
        setStartup('ready');

        onSelect = () => {
          if (!reticle.visible) return;
          const state = scanRef.current.state;
          const measuringLength = LENGTH_STATES.includes(state);
          const measuringWidth = state === 'top-width';
          if (!measuringLength && !measuringWidth) return;

          const point = reticle.position.clone();
          pendingRef.current.push(point);
          addMarker(point);
          if (pendingRef.current.length < 2) return;

          const [first, second] = pendingRef.current;
          const measuredMm = roundToTenthMm(mmBetweenPoints(first, second));
          const event: ArScanEvent = measuringWidth
            ? { type: 'width', widthMm: measuredMm }
            : state === 'top-length'
              ? { type: 'top-length', lengthMm: measuredMm }
              : state === 'angled-length'
                ? { type: 'angled-length', lengthMm: measuredMm }
                : { type: 'angled-retry-length', lengthMm: measuredMm };

          const transition = advanceArScan(scanRef.current, event);
          scanRef.current = transition.snapshot;
          setScan(transition.snapshot);
          clearPending();
          if (transition.measurement) onCompleteRef.current(transition.measurement);
        };
        session.addEventListener('select', onSelect);

        renderer.setAnimationLoop((_time, frame) => {
          if (!frame) return;
          camera.updateMatrixWorld();
          const results = frame.getHitTestResults(hitSource);
          if (results.length > 0) {
            const pose = results[0].getPose(renderer!.xr.getReferenceSpace()!);
            if (pose) {
              reticle.visible = true;
              reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
              if (scanRef.current.state === 'floor-detect') {
                const transition = advanceArScan(scanRef.current, { type: 'floor-ready' });
                scanRef.current = transition.snapshot;
                setScan(transition.snapshot);
                clearPending();
              }
            }
          } else {
            reticle.visible = false;
          }
          renderer!.render(scene, camera);
        });
      } catch {
        if (session) void session.end();
        if (!disposed) setStartup('failed');
      }
    })();

    return () => {
      disposed = true;
      if (session && onSelect) session.removeEventListener('select', onSelect);
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        renderer.domElement.parentElement?.removeChild(renderer.domElement);
      }
      if (session) void session.end();
      markerGroupRef.current = null;
    };
  }, []);

  if (startup === 'failed') {
    return (
      <StepShell title="Couldn't start AR" subtitle="Your browser or device doesn't support in-browser AR measuring. Try typing your measurement instead.">
        <PrimaryButton onClick={onFailed}>Try typing your measurement</PrimaryButton>
      </StepShell>
    );
  }

  return (
    <StepShell title="Scan your foot">
      <div className="ar-stage">
        <div ref={holderRef} className="ar-canvas-holder" />
        {startup === 'ready' ? (
          <ArScanOverlay state={scan.state} error={scan.error} />
        ) : (
          <div className="ar-starting">Starting AR…</div>
        )}
      </div>
      {scan.topLengthMm !== null ? <p className="measure-readout">Length: {(scan.topLengthMm / 10).toFixed(1)} cm</p> : null}
      {scan.widthMm !== null ? <p className="measure-readout">Width: {(scan.widthMm / 10).toFixed(1)} cm</p> : null}
      {scan.state === 'top-width' ? (
        <PrimaryButton onClick={() => applyEvent({ type: 'skip-width' })}>Skip width — continue</PrimaryButton>
      ) : null}
      {scan.state === 'angled-retry' ? (
        <button type="button" className="btn-secondary" onClick={() => applyEvent({ type: 'restart-top' })}>
          Retake top view
        </button>
      ) : null}
    </StepShell>
  );
}
```

Append to `src/styles.css`:

```css
.ar-stage { position: relative; overflow: hidden; min-height: 360px; border-radius: 16px; background: #101820; touch-action: none; }
.ar-canvas-holder, .ar-canvas-holder canvas { width: 100%; height: 360px; display: block; }
.ar-starting { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-weight: 600; }
.ar-scan-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 18px; color: #fff; pointer-events: none; text-align: center; background: linear-gradient(180deg, rgba(16,24,32,0.72), rgba(16,24,32,0.08) 35%, rgba(16,24,32,0.72)); }
.scan-view-badge { align-self: flex-start; border: 1px solid rgba(255,255,255,0.45); border-radius: 999px; padding: 6px 12px; font-size: 0.85rem; font-weight: 700; background: rgba(16,24,32,0.45); }
.scan-foot-outline { width: min(48vw, 210px); color: #00e0c6; fill: none; stroke: currentColor; stroke-width: 4; opacity: 0.9; filter: drop-shadow(0 0 8px rgba(0,224,198,0.45)); }
.scan-instruction-block { min-height: 64px; }
.scan-instruction { margin: 0; font-weight: 700; }
.scan-error { margin: 8px 0 0; color: #ffd166; font-weight: 600; }
.scan-progress { display: flex; gap: 8px; justify-content: center; }
.scan-progress-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.35); }
.scan-progress-dot.active { background: #fff; }
.scan-progress-dot.done { background: #00e0c6; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ArMeasureStep.test.tsx`
Expected: PASS, 1 test

- [ ] **Step 5: Run TypeScript and full tests**

Run: `npm test`
Expected: PASS, including all new scan validation/state/overlay/welcome tests

- [ ] **Step 6: Commit**

```bash
git add src/components/ArMeasureStep.tsx src/components/ArMeasureStep.test.tsx src/styles.css
git commit -m "feat: guide two-angle AR foot scan"
```

---

### Task 6: Full Verification and Final Commit

**Files:**
- No new source files
- Review: `docs/superpowers/specs/2026-11-07-guided-ar-foot-scan-design.md`

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: PASS with no failing tests

- [ ] **Step 2: Build production bundle**

Run: `npm run build`
Expected: TypeScript compilation and Vite production build complete successfully

- [ ] **Step 3: Check supported and unsupported welcome paths**

Run: `npm run dev`
Open `http://localhost:5173` in the desktop browser. Verify:

- Without WebXR, `Type my measurement` is primary and `Take a photo` is secondary.
- With a WebXR support mock or an ARCore Android phone over HTTPS, `Scan my foot` is primary, `Type my measurement` is secondary, and `Take a photo` is absent.
- The AR failure path offers `Try typing your measurement`.

- [ ] **Step 4: Review the final diff**

Run: `git diff main~6..HEAD --stat && git status --short`
Expected: only the planned source/test/CSS files and plan/spec docs are changed; working tree is clean

- [ ] **Step 5: Final commit if any verification fixes were needed**

```bash
git add -A
git commit -m "fix: complete guided AR scan verification"
```

If there were no fixes, do not create an empty commit.
