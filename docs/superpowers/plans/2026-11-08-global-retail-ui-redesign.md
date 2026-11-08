# Global Retail UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the wireframe UI with a premium, brand-neutral global retail design.

**Architecture:** Keep all measurement and sizing logic unchanged. Add a small brand-mark component, enrich the shell/welcome/AR overlay markup, then replace the global stylesheet with a cohesive mobile-first design system.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, CSS, inline SVG.

## Global Constraints

- **Premium global retail:** dark, elegant, commerce-ready, calm, and trustworthy.
- **Brand-neutral:** no sport-specific, gender-specific, or culturally narrow styling.
- **Mobile-first:** primary use is an Android phone in one hand.
- **AR-forward:** the scan step should feel modern and guided, not technical or clinical.
- **No new dependencies:** use CSS, system fonts, React, and inline SVG only.
- Palette: near-black blue gradient (`#070a0f` to `#101720`), translucent white surfaces, teal accent `#35e0c2`, warning `#ffd166`, error `#ff6b6b`.
- No measurement, sizing, quiz, chart, or WebXR logic changes.
- Preserve current accessible names used by tests and screen readers.
- Run `npm test` and `npm run build` after implementation; both must pass before any success claim.

## File Structure

- Create: `src/components/BrandMark.tsx` — reusable neutral product mark.
- Modify: `src/components/StepShell.tsx` — global branded app shell.
- Modify: `src/components/WelcomeStep.tsx` — premium hero and method cards.
- Modify: `src/components/ArScanOverlay.tsx` — segmented AR progress and refined overlay markup.
- Modify tests: `src/components/WelcomeStep.test.tsx`, `src/components/ArScanOverlay.test.tsx`, `src/components/ui.test.tsx`.
- Replace: `src/styles.css` — full global design system.

---

### Task 1: Premium App Structure and AR Markup

**Files:**
- Create: `src/components/BrandMark.tsx`
- Modify: `src/components/StepShell.tsx`
- Modify: `src/components/WelcomeStep.tsx`
- Modify: `src/components/ArScanOverlay.tsx`
- Modify: `src/components/WelcomeStep.test.tsx`
- Modify: `src/components/ArScanOverlay.test.tsx`
- Modify: `src/components/ui.test.tsx`

**Interfaces:**
- Consumes: existing `ChoiceCard` props and `ArScanState` type.
- Produces: `BrandMark()` and updated visible test hooks `brand-mark`, method descriptions, and `scan-progress-segment`.

- [ ] **Step 1: Write the failing tests**

Replace `src/components/WelcomeStep.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeStep } from './WelcomeStep';

test('shows the global retail brand mark', () => {
  render(<WelcomeStep arSupported={false} onSelect={() => {}} />);
  expect(screen.getByTestId('brand-mark')).toHaveTextContent('ShoeSizeFinder');
});

test('supported devices show premium scan and type-in method cards', () => {
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  expect(screen.getByRole('button', { name: /scan my foot/i })).toBeInTheDocument();
  expect(screen.getByText(/camera-guided scan/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.getByText(/already know your foot length/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /take a photo/i })).not.toBeInTheDocument();
});

test('unsupported devices keep type-in primary and photo as fallback', () => {
  render(<WelcomeStep arSupported={false} onSelect={() => {}} />);

  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /take a photo/i })).toBeInTheDocument();
  expect(screen.getByText(/use a card or paper reference/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /scan my foot/i })).not.toBeInTheDocument();
});

test('clicking Scan my foot selects the AR method', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  await user.click(screen.getByRole('button', { name: /scan my foot/i }));
  expect(onSelect).toHaveBeenCalledWith('ar');
});
```

Replace `src/components/ArScanOverlay.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { ArScanOverlay } from './ArScanOverlay';

test('floor detection shows the first progress segment and movement instruction', () => {
  const { container } = render(<ArScanOverlay state="floor-detect" />);
  expect(screen.getByText('Find the floor')).toBeInTheDocument();
  expect(screen.getByText(/move your phone slowly/i)).toBeInTheDocument();
  const progress = screen.getByRole('progressbar', { name: /scan progress/i });
  expect(progress).toHaveAttribute('aria-valuemin', '1');
  expect(progress).toHaveAttribute('aria-valuemax', '4');
  expect(progress).toHaveAttribute('aria-valuenow', '1');
  const segments = container.querySelectorAll('.scan-progress-segment');
  expect(segments).toHaveLength(4);
  expect(segments[0]).toHaveClass('active');
});

test('top view shows the foot-outline instruction and marks floor detection complete', () => {
  const { container } = render(<ArScanOverlay state="top-length" />);
  expect(screen.getByText('Top view')).toBeInTheDocument();
  expect(screen.getByText(/tap your heel/i)).toBeInTheDocument();
  expect(container.querySelector('.scan-foot-outline')).not.toBeNull();
  const segments = container.querySelectorAll('.scan-progress-segment');
  expect(segments[0]).toHaveClass('done');
  expect(segments[1]).toHaveClass('active');
});

test('angled retry shows its instruction and the state-machine error', () => {
  render(<ArScanOverlay state="angled-retry" error="The two readings are 7 mm apart" />);
  expect(screen.getByText('One more check')).toBeInTheDocument();
  expect(screen.getByText(/tap heel and toe once more/i)).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('The two readings are 7 mm apart');
});
```

Add this test to `src/components/ui.test.tsx` without removing its existing tests:

```tsx
test('app shell renders the neutral brand header', () => {
  render(<App />);
  expect(screen.getByTestId('brand-mark')).toHaveTextContent('ShoeSizeFinder');
});
```

If `ui.test.tsx` does not already import `App`, add `import App from '../App';` with the imports.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/WelcomeStep.test.tsx src/components/ArScanOverlay.test.tsx src/components/ui.test.tsx`
Expected: FAIL because `BrandMark` and the new premium markup do not exist.

- [ ] **Step 3: Implement premium structure**

Create `src/components/BrandMark.tsx`:

```tsx
export function BrandMark() {
  return (
    <div className="brand-mark" data-testid="brand-mark" aria-label="ShoeSizeFinder">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M24 7c5.6 1.2 8.7 5.2 8.7 11.1 0 7.4-3.4 10.4-3.4 16.4 0 5.2 2.3 6.8-.8 8.9-2.2 1.5-7.8 1.5-10 0-3.1-2.1-.8-3.7-.8-8.9 0-6-3.4-9-3.4-16.4C14.3 12.2 18.4 8.2 24 7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M19 19h10M20 27h8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span>ShoeSizeFinder</span>
    </div>
  );
}
```

Replace `src/components/StepShell.tsx`:

```tsx
import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';

interface StepShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function StepShell({ title, subtitle, children }: StepShellProps) {
  return (
    <div className="app-shell">
      <header className="brand-header">
        <BrandMark />
      </header>
      <main className="step">
        <h1 className="step-title">{title}</h1>
        {subtitle ? <p className="step-sub">{subtitle}</p> : null}
        {children}
      </main>
    </div>
  );
}
```

Replace `src/components/WelcomeStep.tsx`:

```tsx
import type { MeasureMethod } from '../lib/types';
import { BrandMark } from './BrandMark';
import { ChoiceCard } from './ChoiceCard';

interface WelcomeStepProps {
  arSupported: boolean;
  onSelect: (method: MeasureMethod) => void;
}

export function WelcomeStep({ arSupported, onSelect }: WelcomeStepProps) {
  return (
    <>
      <header className="brand-header">
        <BrandMark />
      </header>
      <section className="hero-panel" aria-labelledby="welcome-title">
        <p className="hero-kicker">Premium fit guide</p>
        <h1 id="welcome-title" className="step-title">Find your true shoe size</h1>
        <p className="hero-subtitle">
          {arSupported
            ? 'Scan your foot with your phone — no card or paper needed.'
            : 'Measure your foot in under a minute.'}
        </p>
        <svg className="hero-footline" viewBox="0 0 120 260" aria-hidden="true">
          <path d="M60 18 C79 20 91 38 92 62 C93 90 84 112 82 139 C80 173 91 199 83 226 C77 247 43 247 37 226 C29 199 40 173 38 139 C36 112 27 90 28 62 C29 38 41 20 60 18 Z" />
        </svg>
      </section>

      <section className="welcome-methods" aria-label="Choose a measurement method">
        {arSupported ? (
          <>
            <ChoiceCard
              selected={false}
              title="Scan my foot"
              description="Camera-guided scan with instant US and UK sizes"
              onSelect={() => onSelect('ar')}
            />
            <ChoiceCard
              selected={false}
              title="Type my measurement"
              description="Already know your foot length? Enter it in centimeters"
              onSelect={() => onSelect('manual')}
            />
          </>
        ) : (
          <>
            <ChoiceCard
              selected={false}
              title="Type my measurement"
              description="Enter your foot length in centimeters"
              onSelect={() => onSelect('manual')}
            />
            <ChoiceCard
              selected={false}
              title="Take a photo"
              description="Use a card or paper reference beside your foot"
              onSelect={() => onSelect('photo')}
            />
          </>
        )}
      </section>

      <p className="privacy-note">Private on-device measurement · No account required</p>
    </>
  );
}
```

Replace `src/components/ArScanOverlay.tsx`:

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
      <div className="scan-topline">
        <div className="scan-view-badge">{VIEW_LABELS[state]}</div>
      </div>
      <svg className="scan-foot-outline" viewBox="0 0 120 260" aria-hidden="true">
        <path d="M60 18 C79 20 91 38 92 62 C93 90 84 112 82 139 C80 173 91 199 83 226 C77 247 43 247 37 226 C29 199 40 173 38 139 C36 112 27 90 28 62 C29 38 41 20 60 18 Z" />
      </svg>
      <div className="scan-instruction-block">
        <p className="scan-instruction">{INSTRUCTIONS[state]}</p>
        {error ? <p className="scan-error" role="alert">{error}</p> : null}
        <div
          className="scan-progress"
          role="progressbar"
          aria-label="Scan progress"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={activeStep + 1}
        >
          {[0, 1, 2, 3].map((step) => (
            <span
              key={step}
              className={`scan-progress-segment${step === activeStep ? ' active' : step < activeStep ? ' done' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass before styling**

Run: `npm test`
Expected: PASS; markup and accessibility behavior are green even before the new stylesheet lands.

- [ ] **Step 5: Commit structure changes**

```bash
git add src/components/BrandMark.tsx src/components/StepShell.tsx src/components/WelcomeStep.tsx src/components/ArScanOverlay.tsx src/components/WelcomeStep.test.tsx src/components/ArScanOverlay.test.tsx src/components/ui.test.tsx
git commit -m "feat: add premium app structure"
```

---

### Task 2: Global Retail Design System

**Files:**
- Replace: `src/styles.css`

**Interfaces:**
- Consumes: class names and markup from Task 1 plus all existing measurement, quiz, photo, and result components.
- Produces: only CSS; no exported code interfaces.

- [ ] **Step 1: Replace the global stylesheet**

Replace all of `src/styles.css` with:

```css
:root {
  --bg-0: #070a0f;
  --bg-1: #101720;
  --surface: rgba(255, 255, 255, 0.065);
  --surface-strong: rgba(255, 255, 255, 0.11);
  --border: rgba(255, 255, 255, 0.12);
  --text: #f7f8fb;
  --muted: #a7b0bf;
  --accent: #35e0c2;
  --accent-soft: rgba(53, 224, 194, 0.16);
  --accent-glow: rgba(53, 224, 194, 0.28);
  --warning: #ffd166;
  --error: #ff6b6b;
  --shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
}

* { box-sizing: border-box; }

html {
  min-width: 320px;
  background: var(--bg-0);
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  color: var(--text);
  background:
    radial-gradient(circle at 18% -10%, rgba(53, 224, 194, 0.16), transparent 34rem),
    radial-gradient(circle at 100% 0%, rgba(122, 167, 255, 0.12), transparent 30rem),
    linear-gradient(145deg, var(--bg-0), var(--bg-1));
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

button,
input,
select { font: inherit; }

button { -webkit-tap-highlight-color: transparent; }

#root {
  width: min(100%, 560px);
  margin: 0 auto;
  padding: 20px 16px 44px;
}

.app-shell { min-height: 100vh; }

.brand-header {
  display: flex;
  align-items: center;
  margin: 2px 0 28px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.brand-mark svg {
  width: 34px;
  height: 34px;
  color: var(--accent);
  filter: drop-shadow(0 0 12px var(--accent-glow));
}

.step {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.step-title {
  margin: 0;
  font-size: clamp(2rem, 10vw, 3rem);
  line-height: 0.96;
  font-weight: 850;
  letter-spacing: -0.055em;
}

.step-sub {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.55;
}

.hero-panel {
  position: relative;
  overflow: hidden;
  padding: 30px 24px 96px;
  border: 1px solid var(--border);
  border-radius: 30px;
  background:
    radial-gradient(circle at 82% 22%, rgba(53, 224, 194, 0.2), transparent 15rem),
    linear-gradient(145deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.045));
  box-shadow: var(--shadow);
}

.hero-panel::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: 29px;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255,255,255,0.16), transparent 34%);
}

.hero-kicker {
  margin: 0 0 14px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-subtitle {
  position: relative;
  max-width: 28rem;
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 1.02rem;
  line-height: 1.55;
}

.hero-footline {
  position: absolute;
  right: -28px;
  bottom: -34px;
  width: 190px;
  height: 380px;
  color: var(--accent);
  fill: none;
  stroke: currentColor;
  stroke-width: 5;
  opacity: 0.13;
  transform: rotate(-10deg);
}

.welcome-methods {
  display: grid;
  gap: 12px;
  margin-top: -56px;
  padding: 0 12px;
  position: relative;
  z-index: 1;
}

.privacy-note {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 0.84rem;
  text-align: center;
}

.choice-card {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px 12px;
  width: 100%;
  min-height: 76px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(13, 20, 29, 0.9);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(18px);
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.choice-card:hover,
.choice-card:focus-visible {
  border-color: rgba(53, 224, 194, 0.48);
  background: rgba(16, 25, 35, 0.96);
  transform: translateY(-1px);
  outline: none;
}

.choice-card:active { transform: translateY(0); }
.choice-card.selected { border-color: var(--accent); }

.welcome-methods .choice-card:first-child {
  border-color: rgba(53, 224, 194, 0.48);
  background:
    linear-gradient(145deg, rgba(53, 224, 194, 0.17), rgba(122, 167, 255, 0.08)),
    rgba(13, 20, 29, 0.94);
}

.choice-title {
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.choice-card::after {
  content: "›";
  color: var(--accent);
  font-size: 1.6rem;
  line-height: 1;
}

.choice-desc {
  grid-column: 1 / -1;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.choice-group { display: flex; flex-direction: column; gap: 10px; }
.choice-group-label { margin: 4px 0 0; color: var(--text); font-size: 0.95rem; font-weight: 750; }

.btn-primary {
  min-height: 56px;
  padding: 15px 20px;
  border: 0;
  border-radius: 17px;
  color: #04110f;
  background: linear-gradient(135deg, var(--accent), #8ab8ff);
  box-shadow: 0 16px 34px rgba(53, 224, 194, 0.22);
  font-size: 1rem;
  font-weight: 850;
  cursor: pointer;
  transition: transform 160ms ease, filter 160ms ease;
}

.btn-primary:hover { filter: brightness(1.06); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

.btn-secondary {
  min-height: 52px;
  padding: 13px 20px;
  border: 1px solid var(--border);
  border-radius: 17px;
  color: var(--text);
  background: var(--surface);
  font-size: 1rem;
  font-weight: 750;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease;
}

.btn-secondary:hover,
.btn-secondary:focus-visible {
  border-color: rgba(255, 255, 255, 0.26);
  background: var(--surface-strong);
  outline: none;
}

.text-input,
select.text-input {
  width: 100%;
  min-height: 56px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 17px;
  outline: none;
  color: var(--text);
  background: rgba(9, 14, 20, 0.88);
  font-size: 1.05rem;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.text-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.error-text { margin: 0; color: var(--error); font-weight: 700; }

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.result-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
}

.result-card::before {
  content: "";
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), transparent);
}

.result-size {
  margin: 6px 0 0;
  font-size: 1.75rem;
  line-height: 1;
  font-weight: 850;
  letter-spacing: -0.04em;
}

.measure-readout {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 42px;
  margin: 0;
  padding: 8px 13px;
  border: 1px solid rgba(53, 224, 194, 0.28);
  border-radius: 999px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 1rem;
  font-weight: 850;
}

.tap-image-wrap {
  position: relative;
  overflow: hidden;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow);
}

.tap-image-wrap img {
  display: block;
  width: 100%;
}

.tap-marker {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid white;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.36), 0 0 20px var(--accent-glow);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.ar-stage {
  position: relative;
  overflow: hidden;
  height: min(72vh, 560px);
  min-height: 420px;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: #020507;
  box-shadow: var(--shadow);
  touch-action: none;
}

.ar-canvas-holder,
.ar-canvas-holder canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.ar-starting {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--text);
  font-weight: 800;
  background: radial-gradient(circle at center, rgba(53, 224, 194, 0.14), transparent 18rem);
}

.ar-scan-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  color: var(--text);
  text-align: center;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(2, 5, 7, 0.78), rgba(2, 5, 7, 0.05) 35%, rgba(2, 5, 7, 0.82));
}

.scan-topline { display: flex; justify-content: flex-start; }

.scan-view-badge {
  padding: 8px 13px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: var(--text);
  background: rgba(4, 9, 13, 0.68);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
  font-size: 0.84rem;
  font-weight: 850;
  backdrop-filter: blur(14px);
}

.scan-foot-outline {
  width: min(56vw, 250px);
  margin: auto;
  color: var(--accent);
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
  opacity: 0.92;
  filter: drop-shadow(0 0 12px var(--accent-glow));
  animation: scan-pulse 2.2s ease-in-out infinite;
}

.scan-instruction-block {
  margin-top: auto;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 20px;
  background: rgba(4, 9, 13, 0.72);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px);
}

.scan-instruction {
  margin: 0;
  font-size: 1rem;
  line-height: 1.42;
  font-weight: 800;
}

.scan-error {
  margin: 8px 0 0;
  color: var(--warning);
  font-weight: 750;
}

.scan-progress {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-top: 13px;
}

.scan-progress-segment {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 180ms ease, box-shadow 180ms ease;
}

.scan-progress-segment.active {
  background: var(--accent);
  box-shadow: 0 0 14px var(--accent-glow);
}

.scan-progress-segment.done { background: rgba(53, 224, 194, 0.72); }

@keyframes scan-pulse {
  0%, 100% { opacity: 0.72; transform: scale(0.985); }
  50% { opacity: 1; transform: scale(1); }
}

@media (max-width: 420px) {
  #root { padding-inline: 14px; }
  .hero-panel { padding: 26px 20px 90px; border-radius: 26px; }
  .welcome-methods { padding-inline: 8px; }
  .result-grid { gap: 10px; }
  .result-card { padding: 16px; border-radius: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Run full verification**

Run: `npm test`
Expected: PASS, 84+ tests including the new UI assertions.

Run: `npm run build`
Expected: TypeScript and Vite production build pass; the existing chunk-size warning is acceptable.

- [ ] **Step 3: Browser inspection**

Run: `npm run dev -- --host 127.0.0.1 --port 5273`
Open `http://127.0.0.1:5273` in the desktop browser and verify:
- dark premium global retail welcome screen;
- hero panel, brand mark, method descriptions, and privacy note;
- no clipped text at desktop width.
Use the browser’s Pixel/device emulation if available and verify the layout remains polished at roughly 390×844.

Stop the dev server after inspection.

- [ ] **Step 4: Commit the design system**

```bash
git add src/styles.css
git commit -m "feat: apply premium global retail design"
```

---

### Task 3: Final Regression and Deployment

**Files:**
- No new source files.

- [ ] **Step 1: Final test and build on `main`**

Run: `npm test && npm run build`
Expected: both commands pass.

- [ ] **Step 2: Push deployment**

```bash
git push
```

Wait for the GitHub Pages deployment to succeed, then open `https://abdullahbinharis-arch.github.io/ShoeSizeFinder/` and verify the redesigned screen is live.

- [ ] **Step 3: Report remaining device verification**

State plainly that visual desktop/browser verification and all automated checks passed, but the AR camera path still needs a real ARCore Android phone.
