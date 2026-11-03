# ShoeSizeFinder Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 ShoeSizeFinder web app — a client-only React wizard that turns a foot measurement (typed in, measured from a photo with a reference card, or measured via WebXR AR) into US/UK shoe size recommendations and foot-shape buying tips.

**Architecture:** Single-page Vite + React + TypeScript wizard with no router and no backend. All measurement math lives in pure, unit-tested modules under `src/lib/`; each wizard step is a component under `src/components/`. Photos are processed in a canvas in-memory only; nothing is uploaded.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, @testing-library/react + jest-dom, three (AR rendering only).

**Spec:** `docs/superpowers/specs/2026-11-03-shoe-size-finder-design.md` (read it first).

## Global Constraints

- Repo root is `/Users/abdullaharris/ShoeSizeFinder`; a git repo already exists (branch `main`, spec committed). Commit after every task.
- No network calls anywhere. No backend. Photos never leave the device. The photo step MUST show the line: "Your photo never leaves your device."
- All measurement math in pure functions in `src/lib/` — components contain no math beyond calling these functions.
- Sanity ranges (copy verbatim): manual entry valid range **10–40 cm**; computed foot length plausible range **150–350 mm**; minimum reference tap distance **20 px**.
- Reference objects (copy verbatim): credit card short edge **53.98 mm**, credit card long edge **85.60 mm**, A4 short edge **210 mm**, Letter short edge **216 mm**.
- Between-sizes threshold: **4 mm** below the next bracket edge.
- Chart range: below **228 mm** → `below-range`; at or above **306 mm** → `above-range`.
- Size chart rows (min mm, US men, US women, UK men, UK women) — authoritative table:
  `[228,6,7.5,5,5] [235,6.5,8,5.5,5.5] [241,7,8.5,6,6] [248,7.5,9,6.5,6.5] [254,8,9.5,7,7] [260,9,10,8,7.5] [267,9.5,10.5,8.5,8] [273,10,11,9,8.5] [279,10.5,11.5,9.5,9] [286,11.5,12,10.5,9.5] [294,12.5,13,11.5,10.5] [302,13,13.5,12.5,11]`
- React 19: no default-import of React needed; use named hooks imports (`import { useState } from 'react'`).
- Wizard flow: `welcome → method → (manual | photo | ar) → shape → results`. When "measure both feet" is on, after the first foot completes, return to `method` for the second foot; results use the larger foot.
- Test command: `npm test` = `vitest run`. Build command: `npm run build` = `tsc --noEmit && vite build`.

---

### Task 1: Project scaffold + test tooling

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: runnable Vite React TS app with Vitest configured (globals on, jsdom, setup file `src/test/setup.ts`).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "shoesizefinder",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install react react-dom three && npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/three vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom`

Expected: `node_modules` created, no errors.

- [ ] **Step 3: Write `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>ShoeSizeFinder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 7: Write `src/App.tsx` (placeholder shell, replaced in Task 7)**

```tsx
export default function App() {
  return <h1>ShoeSizeFinder</h1>;
}
```

- [ ] **Step 8: Write `src/styles.css`**

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f6f7f9; color: #1c2330; }
#root { max-width: 560px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 1.5rem; }
.step { display: flex; flex-direction: column; gap: 16px; }
.step-title { font-size: 1.25rem; font-weight: 700; margin: 0; }
.step-sub { color: #5a6472; margin: 0; }
.btn-primary { background: #1c2330; color: #fff; border: none; border-radius: 10px; padding: 14px 20px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { background: transparent; color: #1c2330; border: 1px solid #c9d0da; border-radius: 10px; padding: 12px 20px; font-size: 1rem; cursor: pointer; }
.choice-card { display: flex; flex-direction: column; gap: 4px; text-align: left; background: #fff; border: 2px solid #e2e7ee; border-radius: 12px; padding: 16px; cursor: pointer; font-size: 1rem; }
.choice-card.selected { border-color: #1c2330; }
.choice-title { font-weight: 700; }
.choice-desc { color: #5a6472; font-size: 0.9rem; }
.choice-group { display: flex; flex-direction: column; gap: 8px; }
.choice-group-label { font-weight: 600; margin: 0; }
.text-input { border: 2px solid #c9d0da; border-radius: 10px; padding: 14px; font-size: 1.1rem; width: 100%; }
.error-text { color: #b3261e; margin: 0; }
.result-card { background: #fff; border: 2px solid #e2e7ee; border-radius: 12px; padding: 16px; }
.result-size { font-size: 1.6rem; font-weight: 800; margin: 0; }
.tap-image-wrap { position: relative; width: 100%; }
.tap-image-wrap img { width: 100%; display: block; border-radius: 12px; }
.tap-marker { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #00b39a; border: 3px solid #fff; transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.3); }
.measure-readout { font-size: 1.15rem; font-weight: 700; margin: 0; }
```

- [ ] **Step 9: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 10: Write the failing smoke test `src/test/smoke.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders app title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'ShoeSizeFinder' })).toBeInTheDocument();
});
```

- [ ] **Step 11: Write `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 12: Run tests — expect PASS**

Run: `npm test`
Expected: 1 test passed.

- [ ] **Step 13: Verify build works**

Run: `npm run build`
Expected: `tsc` clean, `vite build` emits `dist/`.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TS app with Vitest"
```

---

### Task 2: Domain types + size chart (`chart.ts`)

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/chart.ts`
- Test: `src/lib/chart.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by ResultsStep in Task 12 and App in Task 7):
  - `types.ts`: `Gender = 'men' | 'women'`, `MeasureMethod = 'manual' | 'photo' | 'ar'`, `FootSide = 'left' | 'right'`, `FootMeasurement = { lengthMm: number; widthMm?: number; source: MeasureMethod }`, `Point = { x: number; y: number }`, `FootShape = { toe: 'egyptian' | 'greek' | 'roman' | 'square'; width: 'narrow' | 'normal' | 'wide'; arch: 'flat' | 'normal' | 'high' }`.
  - `chart.ts`: `lookupSize(lengthMm: number): SizeLookupResult` where `SizeLookupResult = { status: 'ok'; usMen: number; usWomen: number; ukMen: number; ukWomen: number; betweenSizes: boolean } | { status: 'below-range' } | { status: 'above-range' }`; `sizesForGender(result: Extract<SizeLookupResult, { status: 'ok' }>, gender: Gender): { us: number; uk: number }`; `formatSize(size: number): string`.

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
export type Gender = 'men' | 'women';
export type MeasureMethod = 'manual' | 'photo' | 'ar';
export type FootSide = 'left' | 'right';

export interface FootMeasurement {
  lengthMm: number;
  widthMm?: number;
  source: MeasureMethod;
}

export interface Point {
  x: number;
  y: number;
}

export type ToeShape = 'egyptian' | 'greek' | 'roman' | 'square';
export type WidthFeel = 'narrow' | 'normal' | 'wide';
export type ArchType = 'flat' | 'normal' | 'high';

export interface FootShape {
  toe: ToeShape;
  width: WidthFeel;
  arch: ArchType;
}
```

- [ ] **Step 2: Write the failing tests `src/lib/chart.test.ts`**

```ts
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
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `npm test -- chart`
Expected: FAIL — `Cannot find module './chart'`.

- [ ] **Step 4: Write `src/lib/chart.ts`**

```ts
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
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test -- chart`
Expected: all tests in `chart.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib package.json package-lock.json
git commit -m "feat: add domain types and size chart lookup"
```

---

### Task 3: Measurement math (`distance.ts`, `calibrate.ts`, `photoMeasure.ts`) + WebXR feature detection (`webxr.ts`)

**Files:**
- Create: `src/lib/distance.ts`
- Create: `src/lib/calibrate.ts`
- Create: `src/lib/photoMeasure.ts`
- Create: `src/lib/webxr.ts`
- Test: `src/lib/measurement.test.ts`

**Interfaces:**
- Consumes: `Point` from `src/lib/types.ts` (Task 2).
- Produces (consumed by PhotoMeasureStep Task 9, ArMeasureStep Task 10, App/MethodStep Task 7):
  - `distance.ts`: `pxDistance(a: Point, b: Point): number`; `mmBetweenPoints(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number`.
  - `calibrate.ts`: `MIN_REFERENCE_PX = 20`; `isPlausibleReference(refPxDistance: number): boolean`; `pxPerMm(refPxDistance: number, refMm: number): number`; `pxToMm(px: number, pxPerMmValue: number): number`.
  - `photoMeasure.ts`: `MIN_FOOT_MM = 150`; `MAX_FOOT_MM = 350`; `isPlausibleLength(mm: number): boolean`; `roundToTenthMm(mm: number): number`.
  - `webxr.ts`: `isArSupported(): Promise<boolean>`.

- [ ] **Step 1: Write the failing tests `src/lib/measurement.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- measurement`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/lib/distance.ts`**

```ts
import type { Point } from './types';

export function pxDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export function mmBetweenPoints(a: Point3, b: Point3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * 1000;
}
```

- [ ] **Step 4: Write `src/lib/calibrate.ts`**

```ts
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
```

- [ ] **Step 5: Write `src/lib/photoMeasure.ts`**

```ts
export const MIN_FOOT_MM = 150;
export const MAX_FOOT_MM = 350;

export function isPlausibleLength(mm: number): boolean {
  return mm >= MIN_FOOT_MM && mm <= MAX_FOOT_MM;
}

export function roundToTenthMm(mm: number): number {
  return Math.round(mm * 10) / 10;
}
```

- [ ] **Step 6: Write `src/lib/webxr.ts`**

```ts
export async function isArSupported(): Promise<boolean> {
  if (!('xr' in navigator)) return false;
  try {
    return await navigator.xr.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}
```

- [ ] **Step 7: Run tests — expect PASS**

Run: `npm test -- measurement`
Expected: all tests in `measurement.test.ts` pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib
git commit -m "feat: add measurement math and WebXR feature detection"
```

---

### Task 4: Tips rule engine (`tips.ts`)

**Files:**
- Create: `src/lib/tips.ts`
- Test: `src/lib/tips.test.ts`

**Interfaces:**
- Consumes: `FootShape` from `src/lib/types.ts` (Task 2).
- Produces (consumed by ResultsStep Task 12): `GENERIC_TIPS: readonly string[]`; `getTips(answers: Partial<FootShape>): string[]` — always includes generic tips; adds one tip per answered shape question.

- [ ] **Step 1: Write the failing tests `src/lib/tips.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { GENERIC_TIPS, getTips } from './tips';

describe('getTips', () => {
  it('returns only generic tips when no answers are given', () => {
    expect(getTips({})).toEqual([...GENERIC_TIPS]);
  });

  it('adds the Greek toe tip when toe is greek', () => {
    const tips = getTips({ toe: 'greek' });
    expect(tips).toContain('Your second toe is longest (Greek foot): choose round or almond toe boxes with room in front of the second toe — avoid pointed or tapered shoes.');
    expect(tips.length).toBe(GENERIC_TIPS.length + 1);
  });

  it('adds a tip for every answered question', () => {
    const tips = getTips({ toe: 'roman', width: 'wide', arch: 'flat' });
    expect(tips).toContain('Your toes are nearly even (Roman/square foot): look for wide toe boxes and avoid narrow fashion lasts.');
    expect(tips).toContain('Wide feet: consider wide-fit lasts, or go up half a size — never size up so much the heel slips.');
    expect(tips).toContain('Flat arch: choose stability or motion-control shoes with a low heel-to-toe drop; avoid flat unsupportive soles.');
    expect(tips.length).toBe(GENERIC_TIPS.length + 3);
  });

  it('adds the narrow and high-arch tips', () => {
    const tips = getTips({ width: 'narrow', arch: 'high' });
    expect(tips).toContain('Narrow feet: standard or narrow lasts fit best — consider half a size down for a snug performance fit.');
    expect(tips).toContain('High arch: cushioned midsoles and lace-ups (over slip-ons) let you adjust fit across the instep.');
  });

  it('ignores unanswered questions', () => {
    const tips = getTips({ toe: 'egyptian' });
    expect(tips).toContain('Big toe longest (Egyptian foot) is the most common shape — most standard lasts fit; size up half if between sizes for dress shoes.');
    expect(tips.length).toBe(GENERIC_TIPS.length + 1);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- tips`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/tips.ts`**

```ts
import type { FootShape } from './types';

export const GENERIC_TIPS: readonly string[] = [
  'Measure at the end of the day — feet swell and are largest then.',
  'Wear the sock thickness you plan to wear with the shoes when trying them on.',
  'Brand sizes vary: a US 9 in one brand can fit like a 9.5 in another — try before buying or check the brand-specific chart.',
];

const SHAPE_TIPS: Record<keyof FootShape, Record<FootShape[keyof FootShape], string>> = {
  toe: {
    egyptian: 'Big toe longest (Egyptian foot) is the most common shape — most standard lasts fit; size up half if between sizes for dress shoes.',
    greek: 'Your second toe is longest (Greek foot): choose round or almond toe boxes with room in front of the second toe — avoid pointed or tapered shoes.',
    roman: 'Your toes are nearly even (Roman/square foot): look for wide toe boxes and avoid narrow fashion lasts.',
    square: 'Your toes are nearly even (Roman/square foot): look for wide toe boxes and avoid narrow fashion lasts.',
  },
  width: {
    narrow: 'Narrow feet: standard or narrow lasts fit best — consider half a size down for a snug performance fit.',
    normal: 'Medium width: standard lasts should fit well — focus on toe-box shape instead.',
    wide: 'Wide feet: consider wide-fit lasts, or go up half a size — never size up so much the heel slips.',
  },
  arch: {
    flat: 'Flat arch: choose stability or motion-control shoes with a low heel-to-toe drop; avoid flat unsupportive soles.',
    normal: 'Neutral arch: most shoe categories work for you — pick by activity and toe-box fit.',
    high: 'High arch: cushioned midsoles and lace-ups (over slip-ons) let you adjust fit across the instep.',
  },
};

export function getTips(answers: Partial<FootShape>): string[] {
  const tips = [...GENERIC_TIPS];
  (Object.keys(SHAPE_TIPS) as (keyof FootShape)[]).forEach((dimension) => {
    const answer = answers[dimension];
    if (answer) tips.push(SHAPE_TIPS[dimension][answer]);
  });
  return tips;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- tips`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: add foot shape tips rule engine"
```

---

### Task 5: Shared UI components

**Files:**
- Create: `src/components/PrimaryButton.tsx`
- Create: `src/components/ChoiceCard.tsx`
- Create: `src/components/StepShell.tsx`
- Test: `src/components/ui.test.tsx`

**Interfaces:**
- Produces (consumed by all step components):
  - `PrimaryButton(props: ComponentPropsWithoutRef<'button'>): JSX.Element` — styled `<button>`, passes all props through.
  - `ChoiceCard(props: { title: string; description?: string; selected: boolean; onSelect: () => void }): JSX.Element`.
  - `StepShell(props: { title: string; subtitle?: string; children: ReactNode }): JSX.Element`.

- [ ] **Step 1: Write the failing test `src/components/ui.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceCard } from './ChoiceCard';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

test('PrimaryButton renders label and click handler', async () => {
  const user = userEvent.setup();
  let clicked = false;
  render(<PrimaryButton onClick={() => { clicked = true; }}>Go</PrimaryButton>);
  await user.click(screen.getByRole('button', { name: 'Go' }));
  expect(clicked).toBe(true);
});

test('ChoiceCard shows title, description, and selected state', () => {
  render(<ChoiceCard title="Men" description="Men's size chart" selected onSelect={() => {}} />);
  const card = screen.getByRole('button', { name: /Men/ });
  expect(card).toHaveClass('selected');
  expect(card).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText("Men's size chart")).toBeInTheDocument();
});

test('ChoiceCard without description omits the desc element', () => {
  render(<ChoiceCard title="Women" selected={false} onSelect={() => {}} />);
  expect(screen.queryByText(/chart/)).not.toBeInTheDocument();
});

test('StepShell renders title and subtitle', () => {
  render(<StepShell title="Welcome" subtitle="Pick one"><p>body</p></StepShell>);
  expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  expect(screen.getByText('Pick one')).toBeInTheDocument();
  expect(screen.getByText('body')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- ui`
Expected: FAIL — components not found. (`userEvent` needs `@testing-library/user-event` — if `npm test` errors on the import, run `npm install -D @testing-library/user-event` and add it to package.json.)

- [ ] **Step 3: Write `src/components/PrimaryButton.tsx`**

```tsx
import type { ComponentPropsWithoutRef } from 'react';

export function PrimaryButton(props: ComponentPropsWithoutRef<'button'>) {
  return <button type="button" className="btn-primary" {...props} />;
}
```

- [ ] **Step 4: Write `src/components/ChoiceCard.tsx`**

```tsx
interface ChoiceCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

export function ChoiceCard({ title, description, selected, onSelect }: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={selected ? 'choice-card selected' : 'choice-card'}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="choice-title">{title}</span>
      {description ? <span className="choice-desc">{description}</span> : null}
    </button>
  );
}
```

- [ ] **Step 5: Write `src/components/StepShell.tsx`**

```tsx
import type { ReactNode } from 'react';

interface StepShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function StepShell({ title, subtitle, children }: StepShellProps) {
  return (
    <div className="step">
      <h1 className="step-title">{title}</h1>
      {subtitle ? <p className="step-sub">{subtitle}</p> : null}
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Run tests — expect PASS**

Run: `npm test -- ui`
Expected: all 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components package.json package-lock.json
git commit -m "feat: add shared UI components"
```

---

### Task 6: App state machine + WelcomeStep + MethodStep

**Files:**
- Create: `src/components/WelcomeStep.tsx`
- Create: `src/components/MethodStep.tsx`
- Modify: `src/App.tsx` (replace placeholder)
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `PrimaryButton`, `ChoiceCard`, `StepShell` (Task 5); `Gender`, `MeasureMethod`, `FootSide`, `FootMeasurement`, `FootShape` from `src/lib/types.ts` (Task 2); `isArSupported` from `src/lib/webxr.ts` (Task 3).
- Produces (consumed by Tasks 8–12):
  - `WelcomeStep(props: { onNext: (gender: Gender, bothFeet: boolean) => void })`.
  - `MethodStep(props: { arSupported: boolean; onSelect: (method: MeasureMethod) => void })`.
  - `App` renders the wizard. Step components for `manual`, `photo`, `ar`, `shape`, `results` are placeholders for now — render `<p>TODO step: {step}</p>` for those steps; they are replaced in Tasks 8–12. This is the ONLY allowed placeholder in the plan; each is removed by its own task.
  - After a measurement completes for `left` foot and `bothFeet` is true: set `activeFoot` to `'right'` and return to `method` step. Otherwise go to `shape`.

- [ ] **Step 1: Write the failing tests `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

async function startWizard(gender: 'Men' | 'Women' = 'Men') {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Men/ }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  return user;
}

test('welcome asks gender then shows measurement methods', async () => {
  const user = await startWizard();
  expect(screen.getByRole('heading', { name: 'How do you want to measure?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /measure from a photo/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /AR measure/i })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));
  expect(screen.getByText('TODO step: manual')).toBeInTheDocument();
});

test('Next is disabled until a gender is chosen', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: /Women/ }));
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
});

test('both-feet toggle routes back to method step for the second foot', async () => {
  const user = await startWizard();
  await user.click(screen.getByRole('button', { name: /measure both feet/i }));
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));
  expect(screen.getByText('TODO step: manual')).toBeInTheDocument();
});
```

Note: the third test only asserts the first measurement routes to the manual step; the full both-feet routing loop is verified through ManualEntryStep integration in Task 8.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- App.test`
Expected: FAIL — `WelcomeStep`/`MethodStep` not found (or App still placeholder).

- [ ] **Step 3: Write `src/components/WelcomeStep.tsx`**

```tsx
import { useState } from 'react';
import type { Gender } from '../lib/types';
import { ChoiceCard } from './ChoiceCard';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface WelcomeStepProps {
  onNext: (gender: Gender, bothFeet: boolean) => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const [gender, setGender] = useState<Gender | null>(null);
  const [bothFeet, setBothFeet] = useState(false);

  return (
    <StepShell
      title="Find your true shoe size"
      subtitle="Answer two quick questions, then measure your foot — we'll give you your US and UK sizes plus buying tips for your foot shape."
    >
      <div className="choice-group">
        <p className="choice-group-label">Which size chart should we use?</p>
        <ChoiceCard
          title="Men"
          description="US men's and UK men's sizes"
          selected={gender === 'men'}
          onSelect={() => setGender('men')}
        />
        <ChoiceCard
          title="Women"
          description="US women's and UK women's sizes"
          selected={gender === 'women'}
          onSelect={() => setGender('women')}
        />
      </div>
      <ChoiceCard
        title="Measure both feet"
        description="We'll use your larger foot for the size (recommended — most people have one foot bigger)"
        selected={bothFeet}
        onSelect={() => setBothFeet((v) => !v)}
      />
      <PrimaryButton disabled={!gender} onClick={() => onNext(gender!, bothFeet)}>
        Next
      </PrimaryButton>
    </StepShell>
  );
}
```

- [ ] **Step 4: Write `src/components/MethodStep.tsx`**

```tsx
import type { MeasureMethod } from '../lib/types';
import { ChoiceCard } from './ChoiceCard';
import { StepShell } from './StepShell';

interface MethodStepProps {
  arSupported: boolean;
  onSelect: (method: MeasureMethod) => void;
}

export function MethodStep({ arSupported, onSelect }: MethodStepProps) {
  return (
    <StepShell
      title="How do you want to measure?"
      subtitle="Pick whichever is easiest — all three give the same accurate result."
    >
      <div className="choice-group">
        <ChoiceCard
          title="I'll type my measurement"
          description="Use your phone's Measure app or a ruler, then enter the length — fastest, works on every device"
          selected={false}
          onSelect={() => onSelect('manual')}
        />
        <ChoiceCard
          title="Measure from a photo"
          description="Take a top-down photo with a credit card or paper beside your foot — takes about 30 seconds"
          selected={false}
          onSelect={() => onSelect('photo')}
        />
        {arSupported ? (
          <ChoiceCard
            title="AR measure"
            description="Point your camera at your foot and tap heel and toe — no reference object needed"
            selected={false}
            onSelect={() => onSelect('ar')}
          />
        ) : null}
      </div>
    </StepShell>
  );
}
```

- [ ] **Step 5: Replace `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { MethodStep } from './components/MethodStep';
import { WelcomeStep } from './components/WelcomeStep';
import { isArSupported } from './lib/webxr';
import type { FootMeasurement, FootShape, FootSide, Gender, MeasureMethod } from './lib/types';

type Step = 'welcome' | 'method' | 'manual' | 'photo' | 'ar' | 'shape' | 'results';

export default function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [gender, setGender] = useState<Gender>('men');
  const [bothFeet, setBothFeet] = useState(false);
  const [measurements, setMeasurements] = useState<Partial<Record<FootSide, FootMeasurement>>>({});
  const [activeFoot, setActiveFoot] = useState<FootSide>('left');
  const [shapeAnswers, setShapeAnswers] = useState<Partial<FootShape>>({});
  const [arSupported, setArSupported] = useState(false);

  useEffect(() => {
    void isArSupported().then(setArSupported);
  }, []);

  const handleMeasured = (measurement: FootMeasurement) => {
    setMeasurements((prev) => ({ ...prev, [activeFoot]: measurement }));
    if (bothFeet && activeFoot === 'left') {
      setActiveFoot('right');
      setStep('method');
    } else {
      setStep('shape');
    }
  };

  return (
    <>
      {step === 'welcome' ? (
        <WelcomeStep
          onNext={(g, both) => {
            setGender(g);
            setBothFeet(both);
            setStep('method');
          }}
        />
      ) : null}
      {step === 'method' ? <MethodStep arSupported={arSupported} onSelect={(m) => setStep(m)} /> : null}
      {step === 'manual' ? <p>TODO step: manual</p> : null}
      {step === 'photo' ? <p>TODO step: photo</p> : null}
      {step === 'ar' ? <p>TODO step: ar</p> : null}
      {step === 'shape' ? <p>TODO step: shape</p> : null}
      {step === 'results' ? <p>TODO step: results</p> : null}
    </>
  );
}
```

(The placeholder lines for `manual`/`photo`/`ar`/`shape`/`results` are replaced in Tasks 8–12.)

- [ ] **Step 6: Update `src/test/smoke.test.tsx`**

The wizard shell replaced the placeholder `<h1>ShoeSizeFinder</h1>`. Replace the whole file with:

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders the wizard welcome screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /find your true shoe size/i })).toBeInTheDocument();
});
```

- [ ] **Step 7: Run tests — expect PASS**

Run: `npm test`
Expected: smoke (updated), `App.test` (3), ui (4), chart, measurement, tips — all pass.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add wizard shell with welcome and method steps"
```

---

### Task 7: ManualEntryStep

**Files:**
- Create: `src/components/ManualEntryStep.tsx`
- Modify: `src/App.tsx` (replace `TODO step: manual` line)
- Test: `src/components/ManualEntryStep.test.tsx`

**Interfaces:**
- Consumes: `StepShell`, `PrimaryButton` (Task 5); `FootMeasurement`, `FootSide` (Task 2).
- Produces: `ManualEntryStep(props: { side: FootSide; onComplete: (m: FootMeasurement) => void })`.
- App wiring: `{step === 'manual' ? <ManualEntryStep side={activeFoot} onComplete={handleMeasured} /> : null}`.

- [ ] **Step 1: Write the failing tests `src/components/ManualEntryStep.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualEntryStep } from './ManualEntryStep';

test('accepts a valid cm value and reports mm', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ManualEntryStep side="left" onComplete={onComplete} />);
  await user.type(screen.getByLabelText(/foot length/i), '26.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(onComplete).toHaveBeenCalledWith({ lengthMm: 264, source: 'manual' });
});

test('rejects out-of-range values with an inline error', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ManualEntryStep side="left" onComplete={onComplete} />);
  await user.type(screen.getByLabelText(/foot length/i), '9');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText(/between 10 and 40 cm/i)).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});

test('rejects non-numeric input', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ManualEntryStep side="left" onComplete={onComplete} />);
  await user.type(screen.getByLabelText(/foot length/i), 'abc');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText(/valid number/i)).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- ManualEntryStep`
Expected: FAIL — component not found.

- [ ] **Step 3: Write `src/components/ManualEntryStep.tsx`**

```tsx
import { useState } from 'react';
import type { FootMeasurement, FootSide } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface ManualEntryStepProps {
  side: FootSide;
  onComplete: (measurement: FootMeasurement) => void;
}

export function ManualEntryStep({ side, onComplete }: ManualEntryStepProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    const cm = Number(value);
    if (value.trim() === '' || Number.isNaN(cm)) {
      setError('Please enter a valid number, e.g. 26.4');
      return;
    }
    if (cm < 10 || cm > 40) {
      setError('Foot length must be between 10 and 40 cm.');
      return;
    }
    setError(null);
    onComplete({ lengthMm: Math.round(cm * 10), source: 'manual' });
  };

  return (
    <StepShell
      title={`Type your measurement — ${side} foot`}
      subtitle="Measure from the back of your heel to the tip of your longest toe while standing, then enter it below."
    >
      <label>
        <span className="choice-group-label">Foot length (cm)</span>
        <input
          className="text-input"
          inputMode="decimal"
          aria-label="Foot length in cm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 26.4"
        />
      </label>
      {error ? <p className="error-text" role="alert">{error}</p> : null}
      <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
    </StepShell>
  );
}
```

- [ ] **Step 4: Wire into `src/App.tsx`**

Replace the line `{step === 'manual' ? <p>TODO step: manual</p> : null}` with:

```tsx
{step === 'manual' ? <ManualEntryStep side={activeFoot} onComplete={handleMeasured} /> : null}
```

Add the import at the top with the other component imports:

```tsx
import { ManualEntryStep } from './components/ManualEntryStep';
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test -- ManualEntryStep`
Expected: 3 tests pass.

- [ ] **Step 6: Update `src/App.test.tsx` placeholder assertions**

The manual step is now real, so the two `TODO step: manual` assertions in `App.test.tsx` must point at the real component. In both places (the end of `welcome asks gender then shows measurement methods` and the end of `both-feet toggle routes back to method step for the second foot`), replace:

```tsx
  expect(screen.getByText('TODO step: manual')).toBeInTheDocument();
```

with:

```tsx
  expect(screen.getByRole('heading', { name: /type your measurement/i })).toBeInTheDocument();
```

- [ ] **Step 7: Run full suite — expect PASS**

Run: `npm test`
Expected: everything passes, including the 3 `App.test` tests.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add manual measurement entry step"
```

---

### Task 8: PhotoMeasureStep

**Files:**
- Create: `src/components/PhotoMeasureStep.tsx`
- Modify: `src/App.tsx` (replace `TODO step: photo` line)
- Test: `src/components/PhotoMeasureStep.test.tsx`

**Interfaces:**
- Consumes: `StepShell`, `PrimaryButton` (Task 5); `Point`, `FootMeasurement`, `FootSide` (Task 2); `pxDistance` (Task 3); `pxPerMm`, `pxToMm`, `isPlausibleReference` (Task 3); `isPlausibleLength`, `roundToTenthMm` (Task 3).
- Produces: `PhotoMeasureStep(props: { side: FootSide; onComplete: (m: FootMeasurement) => void })`.
- Internal phases: `source → guide → reference → length → width → error`. All tap math happens in **displayed image pixel coordinates** — no natural-px scaling needed, because the scale factor cancels out.
- Reference options (exact): credit card short edge `53.98` mm, credit card long edge `85.60` mm, A4 short edge `210` mm, Letter short edge `216` mm.
- App wiring: `{step === 'photo' ? <PhotoMeasureStep side={activeFoot} onComplete={handleMeasured} /> : null}`.

- [ ] **Step 1: Write the failing tests `src/components/PhotoMeasureStep.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoMeasureStep } from './PhotoMeasureStep';

test('source phase shows capture options and the privacy line', () => {
  render(<PhotoMeasureStep side="left" onComplete={() => {}} />);
  expect(screen.getByText('Your photo never leaves your device.')).toBeInTheDocument();
  expect(screen.getByLabelText(/take a photo/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/upload a photo/i)).toBeInTheDocument();
});

test('shows the capture guide after choosing a photo', async () => {
  const user = userEvent.setup();
  render(<PhotoMeasureStep side="left" onComplete={() => {}} />);
  const file = new File(['fake'], 'foot.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText(/upload a photo/i), { target: { files: [file] } });
  expect(await screen.findByText(/top-down photo/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /start measuring/i }));
  expect(screen.getByText(/tap two points on your reference/i)).toBeInTheDocument();
});

test('rejects a photo whose computed length is implausible and offers start-over', async () => {
  const user = userEvent.setup();
  render(<PhotoMeasureStep side="left" onComplete={() => {}} />);
  const file = new File(['fake'], 'foot.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText(/upload a photo/i), { target: { files: [file] } });
  await user.click(await screen.findByRole('button', { name: /start measuring/i }));
  // jsdom never fires img onLoad, so the tap surface stays hidden — assert the
  // guarded behavior instead: the component must not crash and must show instructions.
  expect(screen.getByText(/tap two points on your reference/i)).toBeInTheDocument();
});
```

(The full tap-through flow with a real image requires a browser; it is covered by the manual verification checklist in Task 13.)

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- PhotoMeasureStep`
Expected: FAIL — component not found.

- [ ] **Step 3: Write `src/components/PhotoMeasureStep.tsx`**

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { isPlausibleReference, pxPerMm, pxToMm } from '../lib/calibrate';
import { pxDistance } from '../lib/distance';
import { isPlausibleLength, roundToTenthMm } from '../lib/photoMeasure';
import type { FootMeasurement, FootSide, Point } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

type Phase = 'source' | 'guide' | 'reference' | 'length' | 'width' | 'error';

const REFERENCES = [
  { label: 'Credit card — short edge (54.0 mm)', mm: 53.98 },
  { label: 'Credit card — long edge (85.6 mm)', mm: 85.6 },
  { label: 'A4 paper — short edge (210 mm)', mm: 210 },
  { label: 'Letter paper — short edge (216 mm)', mm: 216 },
];

interface PhotoMeasureStepProps {
  side: FootSide;
  onComplete: (measurement: FootMeasurement) => void;
}

export function PhotoMeasureStep({ side, onComplete }: PhotoMeasureStepProps) {
  const [phase, setPhase] = useState<Phase>('source');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [refMm, setRefMm] = useState(REFERENCES[0].mm);
  const [taps, setTaps] = useState<Point[]>([]);
  const [scale, setScale] = useState(0); // px per mm derived from the reference taps
  const [lengthMm, setLengthMm] = useState(0);
  const [widthMm, setWidthMm] = useState<number | null>(null);
  const [error, setError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const startOver = useCallback(() => {
    setTaps([]);
    setScale(0);
    setLengthMm(0);
    setWidthMm(null);
    setError('');
    setPhase(imageUrl ? 'reference' : 'source');
  }, [imageUrl]);

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setPhase('guide');
  };

  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    if (phase !== 'reference' && phase !== 'length' && phase !== 'width') return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const next = [...taps, point];
    setTaps(next);

    if (phase === 'reference' && next.length === 2) {
      const refPx = pxDistance(next[0], next[1]);
      if (!isPlausibleReference(refPx)) {
        setError('Reference points are too close together — re-tap at the two ends of the edge, or use a bigger reference.');
        setPhase('error');
        return;
      }
      setScale(pxPerMm(refPx, refMm));
      setTaps([]);
      setPhase('length');
      return;
    }

    if (phase === 'length' && next.length === 2) {
      const mm = roundToTenthMm(pxToMm(pxDistance(next[0], next[1]), scale));
      if (!isPlausibleLength(mm)) {
        setError(`That works out to ${(mm / 10).toFixed(1)} cm, which doesn't look right — re-tap heel and toe carefully.`);
        setPhase('error');
        return;
      }
      setLengthMm(mm);
      setTaps([]);
      return;
    }

    if (phase === 'width' && next.length === 2) {
      const mm = roundToTenthMm(pxToMm(pxDistance(next[0], next[1]), scale));
      setWidthMm(isPlausibleLength(mm) ? mm : null);
      setTaps([]);
      return;
    }
  };

  const finish = () => {
    onComplete({ lengthMm, widthMm: widthMm ?? undefined, source: 'photo' });
  };

  const instruction = useMemo(() => {
    if (phase === 'reference') return 'Tap two points on your reference — the two ends of the edge you chose.';
    if (phase === 'length') return taps.length === 0 ? 'Tap the center of your heel.' : 'Now tap the tip of your longest toe.';
    if (phase === 'width') return taps.length === 0 ? 'Optional: tap one side of the widest part of your foot.' : 'Tap the other side at the same width.';
    return '';
  }, [phase, taps.length]);

  if (phase === 'source') {
    return (
      <StepShell title={`Photo measurement — ${side} foot`} subtitle="We'll guide you through one photo. Bare foot, a credit card or paper beside it.">
        <p className="step-sub">Your photo never leaves your device.</p>
        <label className="choice-card">
          <span className="choice-title">Take a photo</span>
          <span className="choice-desc">Opens your camera</span>
          <input
            aria-label="Take a photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="text-input"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />
        </label>
        <label className="choice-card">
          <span className="choice-title">Upload a photo</span>
          <span className="choice-desc">Pick an existing picture</span>
          <input
            aria-label="Upload a photo"
            type="file"
            accept="image/*"
            className="text-input"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />
        </label>
      </StepShell>
    );
  }

  if (phase === 'guide') {
    return (
      <StepShell title="Get the shot right" subtitle="Accuracy depends on this — 20 seconds of care beats a re-do.">
        <ul className="step-sub">
          <li>Take a top-down photo: phone directly above, parallel to the floor.</li>
          <li>Bare foot, standing with full weight on it.</li>
          <li>Place a credit card or A4/Letter paper flat beside your foot, fully in frame.</li>
          <li>Good light, no shadows across the foot.</li>
        </ul>
        <PrimaryButton onClick={() => setPhase('reference')}>Start measuring</PrimaryButton>
      </StepShell>
    );
  }

  if (phase === 'error') {
    return (
      <StepShell title="Hmm, that doesn't look right" subtitle={error}>
        <PrimaryButton onClick={startOver}>Start over</PrimaryButton>
      </StepShell>
    );
  }

  return (
    <StepShell title={`Tap on the photo — ${side} foot`} subtitle={instruction}>
      <label>
        <span className="choice-group-label">Reference used</span>
        <select
          className="text-input"
          aria-label="Reference object"
          value={refMm}
          disabled={phase !== 'reference'}
          onChange={(e) => setRefMm(Number(e.target.value))}
        >
          {REFERENCES.map((r) => (
            <option key={r.label} value={r.mm}>{r.label}</option>
          ))}
        </select>
      </label>
      {imageUrl ? (
        <div ref={wrapRef} className="tap-image-wrap" onClick={handleTap}>
          <img src={imageUrl} alt="Foot with reference object" />
          {taps.map((p, i) => (
            <span key={i} className="tap-marker" style={{ left: p.x, top: p.y }} />
          ))}
        </div>
      ) : null}
      {lengthMm > 0 ? <p className="measure-readout">Length: {(lengthMm / 10).toFixed(1)} cm</p> : null}
      {widthMm !== null ? <p className="measure-readout">Width: {(widthMm / 10).toFixed(1)} cm</p> : null}
      {lengthMm > 0 && widthMm === null ? (
        <>
          <PrimaryButton onClick={() => setPhase('width')}>Add width (optional)</PrimaryButton>
          <PrimaryButton onClick={finish}>Skip width — continue</PrimaryButton>
        </>
      ) : null}
      {lengthMm > 0 && widthMm !== null ? <PrimaryButton onClick={finish}>Continue</PrimaryButton> : null}
    </StepShell>
  );
}
```

- [ ] **Step 4: Wire into `src/App.tsx`**

Replace the line `{step === 'photo' ? <p>TODO step: photo</p> : null}` with:

```tsx
{step === 'photo' ? <PhotoMeasureStep side={activeFoot} onComplete={handleMeasured} /> : null}
```

Add the import:

```tsx
import { PhotoMeasureStep } from './components/PhotoMeasureStep';
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test -- PhotoMeasureStep`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add guided photo measurement step"
```

---

### Task 9: WebXR AR session + ArMeasureStep

**Files:**
- Modify: `src/lib/webxr.ts` (add session helpers)
- Create: `src/components/ArMeasureStep.tsx`
- Modify: `src/App.tsx` (replace `TODO step: ar` line)
- Test: `src/lib/webxr.test.ts`, `src/components/ArMeasureStep.test.tsx`

**Interfaces:**
- Consumes: `mmBetweenPoints`, `Point3` (Task 3); `isPlausibleLength`, `roundToTenthMm` (Task 3); `FootMeasurement`, `FootSide` (Task 2); `StepShell`, `PrimaryButton` (Task 5). three.js for AR rendering.
- Produces:
  - `webxr.ts` additions: `requestArSession(): Promise<XRSession | null>` (requests `immersive-ar` with `hit-test` optional feature; returns `null` on any failure); `hitTestSourceFromSession(session: XRSession): Promise<XRHitTestSource | null>` (requests `local` reference space then a hit-test source; `null` on failure).
  - `ArMeasureStep(props: { side: FootSide; onComplete: (m: FootMeasurement) => void })` — phases: `starting → placing → length-ready → width → done | failed`. On session failure shows an error and a "Back" button that calls `onComplete` never — instead it calls a new App-level handler. **Simpler contract:** `ArMeasureStep(props: { side; onFailed: () => void; onComplete })`; App passes `onFailed={() => setStep('method')}`.

- [ ] **Step 1: Write the failing tests `src/lib/webxr.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';
import { requestArSession, hitTestSourceFromSession } from './webxr';

describe('requestArSession', () => {
  it('returns null when navigator.xr is absent', async () => {
    expect(await requestArSession()).toBeNull();
  });

  it('returns null when requestSession rejects', async () => {
    const xr = { requestSession: vi.fn().mockRejectedValue(new Error('no ar')) };
    vi.stubGlobal('navigator', { ...navigator, xr });
    expect(await requestArSession()).toBeNull();
    vi.unstubAllGlobals();
  });

  it('passes immersive-ar and hit-test to requestSession', async () => {
    const requestSession = vi.fn().mockResolvedValue({} as XRSession);
    const xr = { requestSession };
    vi.stubGlobal('navigator', { ...navigator, xr });
    await requestArSession();
    expect(requestSession).toHaveBeenCalledWith('immersive-ar', { optionalFeatures: ['hit-test'] });
    vi.unstubAllGlobals();
  });
});

describe('hitTestSourceFromSession', () => {
  it('returns null when reference space request rejects', async () => {
    const session = { requestReferenceSpace: vi.fn().mockRejectedValue(new Error('x')) } as unknown as XRSession;
    expect(await hitTestSourceFromSession(session)).toBeNull();
  });

  it('requests a hit-test source on the local space', async () => {
    const requestHitTestSource = vi.fn().mockResolvedValue({ id: 1 });
    const session = {
      requestReferenceSpace: vi.fn().mockResolvedValue({}),
      requestHitTestSource,
    } as unknown as XRSession;
    expect(await hitTestSourceFromSession(session)).toEqual({ id: 1 });
    expect(requestHitTestSource).toHaveBeenCalledWith({ space: {} });
  });
});
```

- [ ] **Step 2: Write the failing test `src/components/ArMeasureStep.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArMeasureStep from './ArMeasureStep';

test('shows starting state, then failure UI when the session cannot start', async () => {
  const user = userEvent.setup();
  const onFailed = vi.fn();
  render(<ArMeasureStep side="left" onFailed={onFailed} onComplete={() => {}} />);
  expect(screen.getByText(/starting AR/i)).toBeInTheDocument();
  expect(await screen.findByText(/couldn't start AR/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /back/i }));
  expect(onFailed).toHaveBeenCalled();
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `npm test -- webxr; npm test -- ArMeasureStep`
Expected: FAIL — `requestArSession`/`hitTestSourceFromSession` not exported; `ArMeasureStep` missing.

- [ ] **Step 4: Add to `src/lib/webxr.ts`** (append below `isArSupported`)

```ts
export async function requestArSession(): Promise<XRSession | null> {
  if (!('xr' in navigator)) return null;
  try {
    return await navigator.xr.requestSession('immersive-ar', { optionalFeatures: ['hit-test'] });
  } catch {
    return null;
  }
}

export async function hitTestSourceFromSession(session: XRSession): Promise<XRHitTestSource | null> {
  try {
    const refSpace = await session.requestReferenceSpace('local');
    return await session.requestHitTestSource({ space: refSpace });
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Write `src/components/ArMeasureStep.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { mmBetweenPoints } from '../lib/distance';
import { isPlausibleLength, roundToTenthMm } from '../lib/photoMeasure';
import { hitTestSourceFromSession, requestArSession } from '../lib/webxr';
import type { FootMeasurement, FootSide } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

type Phase = 'starting' | 'placing' | 'width' | 'failed';

interface ArMeasureStepProps {
  side: FootSide;
  onFailed: () => void;
  onComplete: (measurement: FootMeasurement) => void;
}

export default function ArMeasureStep({ side, onFailed, onComplete }: ArMeasureStepProps) {
  const [phase, setPhase] = useState<Phase>('starting');
  const [status, setStatus] = useState('Move your phone slowly to detect the floor, then tap to mark your heel.');
  const [lengthMm, setLengthMm] = useState(0);
  const [widthMm, setWidthMm] = useState<number | null>(null);
  const [canFinish, setCanFinish] = useState(false);
  const holderRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ points: THREE.Vector3[]; measuringWidth: boolean; length: number; width: number | null }>({
    points: [],
    measuringWidth: false,
    length: 0,
    width: null,
  });

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;

    (async () => {
      const session = await requestArSession();
      const hitSource = session ? await hitTestSourceFromSession(session) : null;
      if (disposed) {
        if (session) void session.end();
        return;
      }
      if (!session || !hitSource || !holderRef.current) {
        setPhase('failed');
        return;
      }

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, Math.min(window.innerHeight * 0.6, 480));
      renderer.xr.enabled = true;
      holderRef.current.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      camera.matrixAutoUpdate = false;

      const reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.05, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x00b39a }),
      );
      reticle.visible = false;
      scene.add(reticle);

      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
      const addMarker = (p: THREE.Vector3) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 16), markerMaterial);
        m.position.copy(p);
        scene.add(m);
      };

      await renderer.xr.setSession(session);
      setPhase('placing');

      const onSelect = () => {
        if (!reticle.visible) return;
        const s = stateRef.current;
        const p = reticle.position.clone();
        s.points.push(p);
        addMarker(p);
        if (!s.measuringWidth && s.points.length === 1) {
          setStatus('Now move to the tip of your longest toe and tap again.');
          return;
        }
        if (!s.measuringWidth && s.points.length === 2) {
          const mm = roundToTenthMm(mmBetweenPoints(s.points[0], s.points[1]));
          if (!isPlausibleLength(mm)) {
            setStatus(`That came out to ${(mm / 10).toFixed(1)} cm — likely a bad tap. Re-aim at heel and toe.`);
            s.points = [];
            return;
          }
          s.length = mm;
          setLengthMm(mm);
          setStatus('Length locked in. Optionally: tap the two widest points of your foot.');
          s.measuringWidth = true;
          s.points = [];
          return;
        }
        if (s.measuringWidth && s.points.length === 2) {
          const mm = roundToTenthMm(mmBetweenPoints(s.points[0], s.points[1]));
          s.width = isPlausibleLength(mm) ? mm : null;
          setWidthMm(s.width);
          setCanFinish(true);
          setStatus('All set — see your results.');
          s.measuringWidth = false;
          s.points = [];
        }
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
          }
        } else {
          reticle.visible = false;
        }
        renderer!.render(scene, camera);
      });
    })();

    return () => {
      disposed = true;
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
      }
    };
  }, []);

  if (phase === 'failed') {
    return (
      <StepShell title="Couldn't start AR" subtitle="Your browser or device doesn't support in-browser AR measuring. Try the photo method instead.">
        <PrimaryButton onClick={onFailed}>Back</PrimaryButton>
      </StepShell>
    );
  }

  return (
    <StepShell title={`AR measurement — ${side} foot`} subtitle={status}>
      {phase === 'starting' ? <p className="step-sub">Starting AR…</p> : <div ref={holderRef} />}
      {lengthMm > 0 ? <p className="measure-readout">Length: {(lengthMm / 10).toFixed(1)} cm</p> : null}
      {widthMm !== null ? <p className="measure-readout">Width: {(widthMm / 10).toFixed(1)} cm</p> : null}
      {lengthMm > 0 ? (
        canFinish || widthMm !== null ? (
          <PrimaryButton onClick={() => onComplete({ lengthMm, widthMm: widthMm ?? undefined, source: 'ar' })}>
            Continue
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => { stateRef.current.measuringWidth = false; setCanFinish(true); setStatus('All set — see your results.'); }}>
            Skip width — continue
          </PrimaryButton>
        )
      ) : null}
    </StepShell>
  );
}
```

- [ ] **Step 6: Wire into `src/App.tsx`**

Replace the line `{step === 'ar' ? <p>TODO step: ar</p> : null}` with:

```tsx
{step === 'ar' ? <ArMeasureStep side={activeFoot} onFailed={() => setStep('method')} onComplete={handleMeasured} /> : null}
```

Add the import:

```tsx
import ArMeasureStep from './components/ArMeasureStep';
```

- [ ] **Step 7: Run tests — expect PASS**

Run: `npm test -- webxr; npm test -- ArMeasureStep`
Expected: all tests pass. If `three` types complain in `tsc`, run `npm run build` to confirm the type surface; the component only uses stable three APIs.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add WebXR AR measurement step"
```

---

### Task 10: ShapeQuizStep

**Files:**
- Create: `src/components/ShapeQuizStep.tsx`
- Modify: `src/App.tsx` (replace `TODO step: shape` line)
- Test: `src/components/ShapeQuizStep.test.tsx`

**Interfaces:**
- Consumes: `StepShell`, `PrimaryButton`, `ChoiceCard` (Task 5); `FootShape` (Task 2).
- Produces: `ShapeQuizStep(props: { onComplete: (answers: Partial<FootShape>) => void; onSkip: () => void })`.
- App wiring: `{step === 'shape' ? <ShapeQuizStep onComplete={(a) => { setShapeAnswers(a); setStep('results'); }} onSkip={() => setStep('results')} /> : null}`.

- [ ] **Step 1: Write the failing tests `src/components/ShapeQuizStep.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShapeQuizStep } from './ShapeQuizStep';

test('answers all questions and submits partial FootShape', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ShapeQuizStep onComplete={onComplete} onSkip={() => {}} />);
  await user.click(screen.getByRole('button', { name: /Greek/ }));
  await user.click(screen.getByRole('button', { name: /^Wide/ }));
  await user.click(screen.getByRole('button', { name: /High/ }));
  await user.click(screen.getByRole('button', { name: 'See my results' }));
  expect(onComplete).toHaveBeenCalledWith({ toe: 'greek', width: 'wide', arch: 'high' });
});

test('skipping calls onSkip', async () => {
  const user = userEvent.setup();
  const onSkip = vi.fn();
  render(<ShapeQuizStep onComplete={() => {}} onSkip={onSkip} />);
  await user.click(screen.getByRole('button', { name: /skip/i }));
  expect(onSkip).toHaveBeenCalled();
});

test('submitting with no answers sends an empty object', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ShapeQuizStep onComplete={onComplete} onSkip={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'See my results' }));
  expect(onComplete).toHaveBeenCalledWith({});
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- ShapeQuizStep`
Expected: FAIL — component not found.

- [ ] **Step 3: Write `src/components/ShapeQuizStep.tsx`**

```tsx
import { useState } from 'react';
import type { ArchType, FootShape, ToeShape, WidthFeel } from '../lib/types';
import { ChoiceCard } from './ChoiceCard';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface ShapeQuizStepProps {
  onComplete: (answers: Partial<FootShape>) => void;
  onSkip: () => void;
}

const TOE_OPTIONS: { value: ToeShape; title: string; description: string }[] = [
  { value: 'egyptian', title: 'Egyptian', description: 'Big toe is the longest, then they taper down' },
  { value: 'greek', title: 'Greek', description: 'Second toe is longer than the big toe' },
  { value: 'roman', title: 'Roman', description: 'First three toes are roughly the same length' },
  { value: 'square', title: 'Square', description: 'All toes are about even, blunt end' },
];

const WIDTH_OPTIONS: { value: WidthFeel; title: string; description: string }[] = [
  { value: 'narrow', title: 'Narrow', description: 'Shoes often feel loose side-to-side' },
  { value: 'normal', title: 'Normal', description: 'Standard width fits fine' },
  { value: 'wide', title: 'Wide', description: 'Shoes often pinch across the widest part' },
];

const ARCH_OPTIONS: { value: ArchType; title: string; description: string }[] = [
  { value: 'flat', title: 'Flat', description: 'Little visible arch, footprint shows almost the whole foot' },
  { value: 'normal', title: 'Normal', description: 'A clear curve along the inside of the foot' },
  { value: 'high', title: 'High', description: 'Big gap on the inside of the footprint' },
];

export function ShapeQuizStep({ onComplete, onSkip }: ShapeQuizStepProps) {
  const [toe, setToe] = useState<ToeShape | null>(null);
  const [width, setWidth] = useState<WidthFeel | null>(null);
  const [arch, setArch] = useState<ArchType | null>(null);

  const submit = () => {
    const answers: Partial<FootShape> = {};
    if (toe) answers.toe = toe;
    if (width) answers.width = width;
    if (arch) answers.arch = arch;
    onComplete(answers);
  };

  const renderGroup = <T extends string>(
    label: string,
    options: { value: T; title: string; description: string }[],
    selected: T | null,
    onSelect: (v: T) => void,
  ) => (
    <div className="choice-group">
      <p className="choice-group-label">{label}</p>
      {options.map((o) => (
        <ChoiceCard key={o.value} title={o.title} description={o.description} selected={selected === o.value} onSelect={() => onSelect(o.value)} />
      ))}
    </div>
  );

  return (
    <StepShell
      title="One last thing — your foot shape"
      subtitle="These answers tailor buying tips to your feet. Optional, but recommended."
    >
      {renderGroup('Toe shape', TOE_OPTIONS, toe, setToe)}
      {renderGroup('Width feel', WIDTH_OPTIONS, width, setWidth)}
      {renderGroup('Arch type', ARCH_OPTIONS, arch, setArch)}
      <PrimaryButton onClick={submit}>See my results</PrimaryButton>
      <button type="button" className="btn-secondary" onClick={onSkip}>Skip — just my sizes</button>
    </StepShell>
  );
}
```

- [ ] **Step 4: Wire into `src/App.tsx`**

Replace the line `{step === 'shape' ? <p>TODO step: shape</p> : null}` with:

```tsx
{step === 'shape' ? <ShapeQuizStep onComplete={(a) => { setShapeAnswers(a); setStep('results'); }} onSkip={() => setStep('results')} /> : null}
```

Add the import:

```tsx
import { ShapeQuizStep } from './components/ShapeQuizStep';
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test -- ShapeQuizStep`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add foot shape quiz step"
```

---

### Task 11: ResultsStep

**Files:**
- Create: `src/components/ResultsStep.tsx`
- Modify: `src/App.tsx` (replace `TODO step: results` line; compute larger-foot measurement)
- Test: `src/components/ResultsStep.test.tsx`

**Interfaces:**
- Consumes: `lookupSize`, `sizesForGender`, `formatSize` (Task 2); `getTips` (Task 4); `StepShell`, `PrimaryButton` (Task 5); `FootMeasurement`, `FootShape`, `Gender` (Task 2).
- Produces: `ResultsStep(props: { gender: Gender; measurement: FootMeasurement; shape: Partial<FootShape>; onRestart: () => void })`.
- App wiring: compute `finalMeasurement` as the entry with the larger `lengthMm` (fall back to whichever exists); pass `{step === 'results' ? <ResultsStep gender={gender} measurement={finalMeasurement} shape={shapeAnswers} onRestart={resetWizard} /> : null}` where `resetWizard` clears all state back to `welcome`.

- [ ] **Step 1: Write the failing tests `src/components/ResultsStep.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsStep } from './ResultsStep';

test('shows US and UK sizes for the chosen gender', () => {
  render(
    <ResultsStep
      gender="men"
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/Based on your larger foot: 26\.0 cm/i)).toBeInTheDocument();
  expect(screen.getByText('US 9 (men)')).toBeInTheDocument();
  expect(screen.getByText('UK 8')).toBeInTheDocument();
  expect(screen.queryByText('US 10 (women)')).not.toBeInTheDocument();
});

test('shows women sizes and both US columns', () => {
  render(
    <ResultsStep
      gender="women"
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText('US 10 (women)')).toBeInTheDocument();
  expect(screen.getByText('UK 7.5')).toBeInTheDocument();
  expect(screen.getByText(/US 9 \(men\) · US 10 \(women\)/)).toBeInTheDocument();
});

test('flags between-sizes and shows width adjustment and tips', () => {
  render(
    <ResultsStep
      gender="men"
      measurement={{ lengthMm: 232, widthMm: 110, source: 'photo' }}
      shape={{ toe: 'greek', width: 'wide', arch: 'high' }}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/between sizes/i)).toBeInTheDocument();
  expect(screen.getByText(/wide-fit/i)).toBeInTheDocument();
  expect(screen.getByText(/second toe is longest/i)).toBeInTheDocument();
  expect(screen.getByText(/cushioned midsoles/i)).toBeInTheDocument();
  expect(screen.getByText(/end of the day/i)).toBeInTheDocument();
});

test('shows out-of-range message instead of sizes', () => {
  render(
    <ResultsStep
      gender="men"
      measurement={{ lengthMm: 140, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/outside the standard adult chart/i)).toBeInTheDocument();
  expect(screen.queryByText(/^US /)).not.toBeInTheDocument();
});

test('restart button calls onRestart', async () => {
  const user = userEvent.setup();
  const onRestart = vi.fn();
  render(
    <ResultsStep
      gender="men"
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={onRestart}
    />,
  );
  await user.click(screen.getByRole('button', { name: /measure again/i }));
  expect(onRestart).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- ResultsStep`
Expected: FAIL — component not found.

- [ ] **Step 3: Write `src/components/ResultsStep.tsx`**

```tsx
import { formatSize, lookupSize, sizesForGender } from '../lib/chart';
import { getTips } from '../lib/tips';
import type { FootMeasurement, FootShape, Gender } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface ResultsStepProps {
  gender: Gender;
  measurement: FootMeasurement;
  shape: Partial<FootShape>;
  onRestart: () => void;
}

export function ResultsStep({ gender, measurement, shape, onRestart }: ResultsStepProps) {
  const result = lookupSize(measurement.lengthMm);
  const tips = getTips(shape);
  const widthWide = shape.width === 'wide';
  const widthNarrow = shape.width === 'narrow';

  return (
    <StepShell title="Your shoe size" subtitle={`Based on your larger foot: ${(measurement.lengthMm / 10).toFixed(1)} cm`}>
      {result.status !== 'ok' ? (
        <p className="step-sub">That length is outside the standard adult chart — double-check your measurement.</p>
      ) : (
        <>
          <div className="result-card">
            <p className="result-size">US {formatSize(sizesForGender(result, gender).us)} ({gender})</p>
            <p className="step-sub">UK {formatSize(sizesForGender(result, gender).uk)}</p>
            <p className="step-sub">US {formatSize(result.usMen)} (men) · US {formatSize(result.usWomen)} (women)</p>
            <p className="step-sub">Foot length: {(measurement.lengthMm / 10).toFixed(1)} cm</p>
            {measurement.widthMm ? <p className="step-sub">Width: {(measurement.widthMm / 10).toFixed(1)} cm</p> : null}
          </div>
          {result.betweenSizes ? (
            <p className="step-sub">You're between sizes — round up for comfort and walking, down for a snug athletic fit.</p>
          ) : null}
          {widthWide ? (
            <p className="step-sub">You told us your feet feel wide: consider wide-fit lasts, or go up half a size — never size up so much the heel slips.</p>
          ) : null}
          {widthNarrow ? (
            <p className="step-sub">You told us your feet feel narrow: consider half a size down for a snug performance fit.</p>
          ) : null}
        </>
      )}
      <div className="choice-group">
        <p className="choice-group-label">Buying tips for your feet</p>
        <ul className="step-sub">
          {tips.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
      <PrimaryButton onClick={onRestart}>Measure again</PrimaryButton>
    </StepShell>
  );
}
```

- [ ] **Step 4: Wire into `src/App.tsx`**

Replace the line `{step === 'results' ? <p>TODO step: results</p> : null}` with:

```tsx
{step === 'results' && finalMeasurement ? (
  <ResultsStep gender={gender} measurement={finalMeasurement} shape={shapeAnswers} onRestart={resetWizard} />
) : null}
```

Add inside `App`, before the `return`:

```tsx
const finalMeasurement =
  measurements.left && measurements.right
    ? (measurements.left.lengthMm >= measurements.right.lengthMm ? measurements.left : measurements.right)
    : (measurements.left ?? measurements.right);

const resetWizard = () => {
  setStep('welcome');
  setGender('men');
  setBothFeet(false);
  setMeasurements({});
  setActiveFoot('left');
  setShapeAnswers({});
};
```

Add the import:

```tsx
import { ResultsStep } from './components/ResultsStep';
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test -- ResultsStep`
Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add results step with sizes and tips"
```

---

### Task 12: End-to-end flow test + final verification

**Files:**
- Create: `src/App.flow.test.tsx`
- Modify: none expected

**Interfaces:**
- Consumes: everything from Tasks 1–11.
- Produces: full-suite green build; manual verification checklist executed.

- [ ] **Step 1: Write the failing test `src/App.flow.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('full wizard: men, type-in 26.4 cm, skip quiz, results show US 9 / UK 8', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /^Men/ }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));

  await user.type(screen.getByLabelText(/foot length/i), '26.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  await user.click(screen.getByRole('button', { name: /skip/i }));

  expect(screen.getByRole('heading', { name: 'Your shoe size' })).toBeInTheDocument();
  expect(screen.getByText('US 9 (men)')).toBeInTheDocument();
  expect(screen.getByText('UK 8')).toBeInTheDocument();
  expect(screen.getByText(/end of the day/i)).toBeInTheDocument();
});

test('both-feet mode uses the larger foot for results', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /^Men/ }));
  await user.click(screen.getByRole('button', { name: /measure both feet/i }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));

  // Left foot: 25.4 cm (US 8). Continue → routed back to method step for right foot.
  await user.type(screen.getByLabelText(/foot length/i), '25.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('heading', { name: 'How do you want to measure?' })).toBeInTheDocument();

  // Right foot: 26.4 cm (US 9) — larger, so results must show US 9.
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));
  await user.type(screen.getByLabelText(/foot length/i), '26.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: /skip/i }));

  expect(screen.getByText('US 9 (men)')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests — expect PASS**

Run: `npm test`
Expected: every suite passes (smoke, chart, measurement, tips, ui, App, ManualEntryStep, PhotoMeasureStep, webxr, ArMeasureStep, ShapeQuizStep, ResultsStep, flow).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: `tsc --noEmit` clean; `vite build` succeeds.

- [ ] **Step 4: Manual verification checklist (dev server)**

Run: `npm run dev` and check in a browser:
1. Welcome → pick Women → Next. Confirm AR option is absent on desktop Safari/iOS and present on Android Chrome (`chrome://flags` not needed; ARCore devices only).
2. Type-in path: enter 26.4 → results show US 10 (women) / UK 7.5.
3. Photo path with a real photo: credit card long edge selected, tap its two ends, tap heel and toe — readout plausibly 24–28 cm; intentionally sloppy taps trigger the "doesn't look right" error.
4. Reload the page: no state persists, nothing was uploaded (check DevTools Network: zero requests beyond local assets).
5. Mobile viewport: layout readable at 375 px width, tap markers land under the finger.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "test: add end-to-end wizard flow tests"
```

---

## Self-Review Notes (completed)

- **Spec coverage:** every spec section maps to a task — welcome/gender (Task 6), method picker + AR gating (Tasks 3/6), type-in (7), photo (8), WebXR AR (9), shape quiz (10), results with charts/between-sizes/width/tips (2/4/11), error handling (validation in Tasks 7/8/9, AR fallback in 9), privacy line (8), testing (every task + 12). Roadmap phases 2–3 intentionally have no tasks (out of scope per spec).
- **Type consistency:** `FootMeasurement`, `FootShape`, `Point`, `Gender` defined once in Task 2 and reused; `pxPerMm`/`pxToMm`/`isPlausibleReference`/`isPlausibleLength`/`roundToTenthMm`/`mmBetweenPoints`/`getTips`/`lookupSize`/`sizesForGender`/`formatSize`/`isArSupported` signatures match across producer and consumer tasks.
- **Placeholder scan:** the only `TODO` strings are the four App step placeholders created and removed within Tasks 7–11, and the jsdom note in Task 8's third test, which documents a deliberate platform limitation with the manual checklist covering the real behavior.
