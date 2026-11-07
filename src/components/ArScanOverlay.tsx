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
