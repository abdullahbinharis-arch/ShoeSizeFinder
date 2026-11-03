# ShoeSizeFinder — Design Spec

**Date:** 2026-11-03
**Status:** Approved (pending final spec review)
**Product roadmap:** Phase 1 = universal web app (this spec). Phase 2 = native Android app. Phase 3 = native iOS app. The measurement layer changes per phase; the size charts, gender logic, fit adjustment, and tips engine are shared across all three.

## Overview

A web app that tells a user their shoe size in US (men's/women's) and UK sizing from a foot measurement, then gives buying tips matched to their foot shape. Three ways to get the measurement, best first:

1. **Type-in** — user measures with their phone's built-in Measure app (or a ruler) and enters foot length in cm. Zero calibration, works on every device. This is the escape hatch that avoids photo calibration entirely.
2. **Guided photo** — user takes a top-down photo of their bare foot next to a reference object (credit card or A4/Letter paper), taps two known points on the reference for scale, then taps heel and longest toe. App converts pixels → mm.
3. **In-browser AR** — WebXR `immersive-ar` with plane hit-testing; user taps heel and toe on the live camera view. Offered only when `navigator.xr.isSessionSupported('immersive-ar')` resolves true (Android Chrome with ARCore). iOS Safari is not supported for WebXR AR and never sees this option.

All three paths produce the same value — foot length in mm — which feeds one shared results engine. Width (mm) is optional extra input from paths 2 and 3.

## Goals

- Accurate US/UK size recommendation from foot length, adjusted for gender and width.
- Shape-based buying tips users can act on in a store.
- Runs 100% client-side: no backend, no photo upload, nothing leaves the device.
- Works in any modern mobile or desktop browser.

## Non-goals (Phase 1)

- Automatic foot detection/segmentation from photos (manual marker taps only).
- WebXR AR on iOS (impossible in Safari; covered by the type-in path).
- Accounts, history, or saved measurements.
- Brand-specific size charts (Nike vs. Adidas run differently; out of scope, mention in tips as advice).
- Children's sizing.

## User flow

1. **Welcome** — one-line pitch + gender question: Men / Women. (Charts differ; "unisex" is handled by showing both men's and women's US columns on results.)
2. **Measurement method** — three options: "I'll type my measurement", "Measure from a photo", "Measure in AR" (shown only if WebXR AR is supported).
3. **Measurement:**
   - *Type-in:* input for foot length (cm, one decimal, e.g. 26.4). If "measure both feet" is chosen (see step 1 toggle), two inputs; the larger foot wins.
   - *Photo:* capture guide (top-down, barefoot, foot + reference fully in frame, camera parallel to floor) → photo upload or camera capture → tap two points on the reference whose real distance the app knows (credit card short edge 53.98 mm, long edge 85.60 mm; A4 short edge 210 mm; Letter short edge 216 mm — user picks which reference and which edge they tapped) → tap heel center → tap longest toe tip → live readout in mm → optional width (two taps at widest points) → optional second foot.
   - *AR:* WebXR session, hit-test reticle, tap to drop heel point, move to toe, tap to drop toe point → distance shown in mm → optional width the same way → optional second foot.
4. **Foot shape quiz** (optional, skippable) — three questions, each with a visual/text selector:
   - Toe shape: Egyptian (big toe longest) / Greek (second toe longest) / Roman (first three roughly even) / Square (all even).
   - Width feel: narrow / normal / wide.
   - Arch: flat / normal / high.
5. **Results** — measured length in cm; primary size (US + UK for the chosen gender); if unisex view, both men's and women's US; width-based fit adjustment; note if between sizes (round up for comfort, round down for snug); shape-matched buying tips list; CTA "Measure again".

## Architecture

Single-page React app, Vite + TypeScript. No router needed beyond step state; a lightweight `useState` wizard state or tiny context suffices.

### Modules

- `src/lib/calibrate.ts` — px→mm from two reference taps + known reference distance in mm. Pure functions, unit-tested.
- `src/lib/distance.ts` — pixel-distance between two taps given image display scale (account for CSS scaling vs. natural image size). Pure, unit-tested.
- `src/lib/chart.ts` — Brannock-derived size tables and lookup: `lengthMm → { usMen, usWomen, ukMen, ukWomen }`. Returns the size whose bracket contains the length; flag when the length is within 4 mm of a bracket edge (between-sizes signal).
- `src/lib/tips.ts` — rule engine: `(toeShape, widthFeel, arch) → string[]` of buying tips. Pure, unit-tested.
- `src/lib/webxr.ts` — feature detection (`isSessionSupported`), AR session lifecycle, hit-test helpers. Kept isolated so the rest of the app never touches WebXR APIs directly.
- `src/components/` — one component per wizard step (`WelcomeStep`, `MethodStep`, `ManualEntryStep`, `PhotoMeasureStep`, `ArMeasureStep`, `ShapeQuizStep`, `ResultsStep`) plus shared UI (`PrimaryButton`, `SegmentedChoice`).
- `src/state/AppState.ts` — wizard state: `{ gender, method, measurements: { left?, right? }, shape?: {...} }`.

### Data flow

Each measurement step emits a normalized `FootMeasurement { lengthMm: number; widthMm?: number; source: 'manual' | 'photo' | 'ar' }`. The wizard keeps at most two (left/right; if user only measures one, it is used for both). Results computes on the larger of the two. Shape quiz is optional; absent answers mean no shape-specific tips (generic fit tips still shown).

## Measurement details & accuracy

- Photo path accuracy depends on the camera being parallel to the floor and the reference being in the same plane as the foot. The capture guide and an on-screen "keep phone flat and directly above" hint are the mitigation. Expected error ±2–3 mm with a carefull user — acceptable because a half shoe size is ~4–5 mm of foot length and we surface the between-sizes flag.
- AR path error: ARKit/ARCore hit-test on a floor plane, comparable to the Measure app (±5 mm); fine for shoe sizing given the between-sizes guard.
- Sanity checks everywhere: computed lengths outside 150–350 mm are rejected with a "that doesn't look right — please re-tap" message. Manual entry outside 10–40 cm likewise.

## Size chart

Standard adult Brannock-derived conversion (representative rows; the code table is authoritative and unit-tested at every boundary):

| Foot length (cm) | US Men | US Women | UK Men | UK Women |
|---|---|---|---|---|
| 22.8 | 6 | 7.5 | 5 | 5 |
| 23.5 | 6.5 | 8 | 5.5 | 5.5 |
| 24.1 | 7 | 8.5 | 6 | 6 |
| 24.8 | 7.5 | 9 | 6.5 | 6.5 |
| 25.4 | 8 | 9.5 | 7 | 7 |
| 26.0 | 9 | 10 | 8 | 7.5 |
| 26.7 | 9.5 | 10.5 | 8.5 | 8 |
| 27.3 | 10 | 11 | 9 | 8.5 |
| 27.9 | 10.5 | 11.5 | 9.5 | 9 |
| 28.6 | 11.5 | 12 | 10.5 | 9.5 |
| 29.4 | 12.5 | 13 | 11.5 | 10.5 |
| 30.2 | 13 | 13.5 | 12.5 | 11 |

A length below the smallest row → "below standard adult chart" message; above the largest → same for large. Results show the UK column matching the chosen gender (men → UK Men, women → UK Women; unisex view shows both, derived from the same length row).

## Fit adjustment & tips

- Width feel `wide` → recommend wide-fit lasts and/or half a size up; `narrow` → recommend narrow lasts/laces snugly, half size down for snug fit preference.
- Between-sizes flag (within 4 mm of a bracket edge) → "You sit between X and Y — round up for comfort/walking, down for a snug athletic fit."
- Tips rules (representative):
  - Greek toe → avoid tapered/pointed toe boxes; choose round or almond toe with room in front of the second toe.
  - Roman/square toe → wide toe box brands; avoid narrow fashion lasts.
  - Egyptian → standard guidance; still size up half if between sizes for dress shoes.
  - Flat arch → stability/motion-control categories, low heel-to-toe drop, avoid unsupportive flats.
  - High arch → cushioned midsoles, lace-ups over slip-ons for adjustability.
  - Always-on tips: measure feet at end of day (feet swell), wear the sock type you'll use, brand sizes vary — try before buying or check brand-specific charts.

## Error handling

- Camera permission denied → fall back to photo upload (file input).
- WebXR unsupported or session fails → hide/abort AR path gracefully, return to method picker.
- Implausible calibration (reference taps under 20 px apart on a low-res image) → ask for re-tap or larger reference.
- Re-tap affordance on every tapping step ("start over" per point pair).
- Malformed manual entry → inline validation, block continue.

## Testing

- Vitest + React Testing Library.
- Unit: `calibrate.ts` (known px distances → mm), `distance.ts` (display-scale handling), `chart.ts` (every bracket boundary, between-sizes flag, out-of-range), `tips.ts` (every rule fires, absent answers → generic tips only).
- Component: wizard flow renders each step, manual entry → results shows expected sizes (e.g. 26.4 cm → US Men 9).
- Manual verification: photo path with a real credit card; AR path on an ARCore Android device. No backend to integration-test.

## Privacy

All processing client-side. Photos are read into a canvas in-memory only; nothing is uploaded or stored. State the "your photo never leaves your device" line on the photo step — it is a selling point.

## Later phases (out of scope here)

- **Android app:** reuse charts/tips logic (extract to a shared TS package when the time comes); measurement via ARCore + SceneView.
- **iOS app:** ARKit + SwiftUI; ARKit gives Measure-app-quality measuring with no reference object; type-in and photo paths remain as fallbacks.
