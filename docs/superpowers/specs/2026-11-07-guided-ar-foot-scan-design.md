# Guided AR Foot Scan — Design Spec

**Date:** 2026-11-07
**Status:** Approved
**Target:** Android phones with in-browser WebXR AR support (Chrome + ARCore over HTTPS)
**Related spec:** `2026-11-03-shoe-size-finder-design.md`

## Overview

Add a face-verification-style guided foot scan for supported Android devices. The user aligns their bare foot to an on-screen outline, takes a top-view measurement, then takes a second measurement from an angled side view. Both measurements use ARCore hit-test coordinates, so the phone supplies real-world scale. No A4 paper, credit/debit card, or other external reference is required.

The scan produces the same normalized `FootMeasurement` as the existing paths, then continues through the existing optional foot-shape quiz and results steps.

## Goals

- Make supported-device measurement reference-free.
- Improve reliability by comparing two metric length readings from different camera angles.
- Keep the scan concise: floor detection, one top view, one angled view, then finish.
- Preserve the existing client-side-only privacy guarantee.

## Non-goals

- Automatic foot detection, toe-shape recognition, or arch classification from camera imagery.
- iPhone WebXR support; iOS remains outside the WebXR AR scope.
- Replacing the existing native-app roadmap phases.
- Changing the size chart, fit rules, quiz, or results behavior.

## Supported-device flow

1. **Welcome** — when AR support is detected, show **“Scan my foot”** as the primary option and **“Type my measurement”** as the fallback. Do not show the card-referenced photo path on supported devices. When AR is unsupported, show **“Type my measurement”** as the primary measurement option.
2. **Find the floor** — the user slowly moves the phone while ARCore initializes and hit tests begin returning floor points.
3. **Top view** — show a foot-shaped outline, “Top view” label, progress indicator, and concise instruction. The user aligns the foot inside the outline, then:
   - taps the heel,
   - taps the tip of the longest toe,
   - optionally taps the two widest points, or skips width.
4. **Angled check** — an animation asks the user to move to about a 45° side view, similar to turning a head during face verification. The user taps heel and longest toe again.
5. **Validation and completion** — compare the two length readings:
   - difference ≤ **5 mm**: average the two readings, round to 0.1 mm, and finish;
   - difference > **5 mm**: request one angled-view retry;
   - retry still differs by > **5 mm**: return to the top-view step and require fresh top-view marks rather than guessing.
6. Continue to the existing optional, skippable foot-shape quiz, then results.

## Interaction limits

The outline is a visual alignment guide only. The first version does not detect whether a real foot is inside it. The scan still rejects implausible floor-plane distances and width values. This keeps the feature feasible in a browser without adding an ML segmentation dependency.

## Architecture

- **`src/lib/arScan.ts`** — pure scan state machine and measurement math. It accepts discrete measured points or distances, validates them, handles the second-angle comparison and retry, and emits the final `FootMeasurement`. It must not access WebXR, React, or Three.js.
- **`src/lib/scanValidation.ts`** — pure length and width validation. Length retains the existing adult sanity range; width is validated against both absolute adult bounds and the measured length ratio. Width must not reuse the adult foot-length validator.
- **`src/components/ArMeasureStep.tsx`** — owns WebXR session startup, Three.js rendering, reticle and marker placement, and conversion from 3D points into state-machine events. It reports startup failure through its existing `onFailed` interface.
- **`src/components/ArScanOverlay.tsx`** — presentational layer for the foot outline, view labels, progress dots, instruction text, and retry messaging. It contains no WebXR or measurement logic.
- **`src/components/WelcomeStep.tsx`** — promotes the AR scan when supported and keeps the type-in fallback. It does not change measurement results.
- **`src/App.tsx`** — unchanged flow: measurement → optional shape quiz → results.

## Data and calculations

All distances remain in millimeters internally.

- Top-view length is `distance(topHeel, topToe)`.
- Angled-view length is `distance(angledHeel, angledToe)`.
- Final length is `(topLength + angledLength) / 2`, rounded to 0.1 mm, only when their absolute difference is ≤ 5 mm.
- Width remains optional and is measured once on the top view.
- The result is `{ lengthMm, widthMm?, source: 'ar' }`.

## Error handling

- WebXR unavailable, permission denied, or session startup failure → return to the welcome/type-in fallback.
- No floor hit-test result → keep the reticle hidden and show a slow-movement instruction.
- Implausible heel-to-toe distance → reject that pair and request a retap.
- Implausible width or width-to-length ratio → reject the width pair and request a retap.
- Two angle readings differ by more than 5 mm → one angled retry, then return to top view.
- Session loss during the scan → discard the in-progress measurement and allow restart without restarting the app.

## Testing

Use Vitest + React Testing Library, consistent with the existing suite.

- Unit-test every `arScan` state transition, including successful average, first mismatch retry, second-mismatch return, optional width skip, and invalid point/distance events.
- Boundary-test length validation and width validation, including narrow and wide adult ratios.
- Component-test AR startup failure and the fallback button path with WebXR mocks.
- Component-test visible instructions and progress transitions where WebXR calls are mocked.
- Manual verification on at least one ARCore Android phone remains required for camera angle, hit-test accuracy, reticle behavior, and session restart.

## Privacy

The camera feed is rendered only by the WebXR session. Measured coordinates and camera imagery remain in memory on the device and are never uploaded or persisted.
