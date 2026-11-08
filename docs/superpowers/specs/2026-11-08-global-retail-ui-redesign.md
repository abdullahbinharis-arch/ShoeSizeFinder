# Global Retail UI Redesign — Design Spec

**Date:** 2026-11-08
**Status:** Approved by user direction (“2”, then “just create me one”)
**Target:** ShoeSizeFinder mobile web app and WebXR AR scan

## Overview

Replace the current wireframe-like interface with a premium, globally reusable retail design. The interface must feel polished enough for shoe, fashion, sports, and retail brands worldwide without assuming one brand identity. The first version is a strongly designed default theme, not a brand-admin customization system.

## Visual direction

- **Premium global retail:** dark, elegant, commerce-ready, calm, and trustworthy.
- **Brand-neutral:** no sport-specific, gender-specific, or culturally narrow styling.
- **Mobile-first:** primary use is an Android phone in one hand.
- **AR-forward:** the scan step should feel modern and guided, not technical or clinical.
- **No new dependencies:** use CSS, system fonts, React, and inline SVG only.

## Design system

### Palette

- Page background: near-black blue gradient (`#070a0f` to `#101720`)
- Surface: translucent white (`rgba(255, 255, 255, 0.06)`)
- Surface border: `rgba(255, 255, 255, 0.12)`
- Primary text: `#f7f8fb`
- Secondary text: `#a7b0bf`
- Accent: teal (`#35e0c2`)
- Accent glow: `rgba(53, 224, 194, 0.25)`
- Warning: amber (`#ffd166`)
- Error: coral (`#ff6b6b`)

### Shape, depth, and type

- Radius: 18–28 px for cards and buttons
- Shadows: soft, low-opacity dark shadows with restrained accent glows
- Buttons: 56 px minimum touch height, strong primary hierarchy, clear secondary fallback
- Titles: compact, high-contrast, modern system stack
- Body: short, direct mobile copy with generous line height
- Cards: glass-like retail panels with a subtle border and hover/pressed state

## Screen changes

### Global shell

Every step gets a consistent premium shell:

- Small `ShoeSizeFinder` wordmark/header
- Consistent page width and mobile-safe padding
- Cards and controls aligned to one vertical rhythm
- A subtle footer/privacy line where appropriate

### Welcome

- Hero-style opening panel with a soft accent glow and simple shoe/foot outline mark
- Benefit-led headline: finding the correct US/UK size and fit guidance
- Measurement choices become large method cards, not plain buttons
- Supported AR devices:
  - Primary card: **Scan my foot**
  - Secondary card: **Type my measurement**
- Unsupported devices:
  - Primary card: **Type my measurement**
  - Secondary card: **Take a photo**
- Keep all existing method names accessible to tests and assistive technology

### Measurement steps

- Inputs and choice cards use the same premium panel styling
- Readouts appear as compact measurement chips/cards
- Error text uses the shared warning/error treatment without changing validation behavior

### Results

- Size grid cards become premium retail tiles
- Keep the four-size grid and existing copy hierarchy
- Emphasize measured length and between-sizes note without changing calculations

### AR scan overlay

- Full dark camera stage with a restrained top/bottom readability gradient
- Rounded view badge (“Top view”, “45° view”, etc.)
- Larger, more refined glowing foot outline
- Clear instruction card near the bottom
- Progress becomes a segmented bar instead of tiny disconnected dots
- Errors stay visible in the instruction card
- The overlay remains presentational and does not own scan logic

## Behavior constraints

- No measurement, sizing, quiz, chart, or WebXR logic changes
- No dependency additions
- Preserve current accessible names used by tests and screen readers
- Preserve all fallback behavior and privacy guarantees
- The design must remain usable on unsupported browsers and desktop widths

## Testing

- Update component tests only where markup changes require stronger assertions.
- Verify all existing behavior tests still pass.
- Add or update tests for visible premium welcome elements and AR progress segmentation.
- Run `npm test` and `npm run build`.
- Manually inspect desktop and emulated Android viewports; AR camera behavior still requires a real ARCore device.

## Non-goals

- Brand logo/color admin settings
- Localization plumbing
- New animations beyond CSS transitions
- Illustration libraries or icon dependencies
- Changes to measurement accuracy or size charts
