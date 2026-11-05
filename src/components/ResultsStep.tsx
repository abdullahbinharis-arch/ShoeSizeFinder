import { formatSize, lookupSize } from '../lib/chart';
import { getTips } from '../lib/tips';
import type { FootMeasurement, FootShape } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface ResultsStepProps {
  measurement: FootMeasurement;
  shape: Partial<FootShape>;
  onRestart: () => void;
}

export function ResultsStep({ measurement, shape, onRestart }: ResultsStepProps) {
  const result = lookupSize(measurement.lengthMm);
  const tips = getTips(shape);
  const widthWide = shape.width === 'wide';
  const widthNarrow = shape.width === 'narrow';

  return (
    <StepShell title="Your shoe size" subtitle={`Based on your foot: ${(measurement.lengthMm / 10).toFixed(1)} cm`}>
      {result.status !== 'ok' ? (
        <p className="step-sub">That length is outside the standard adult chart — double-check your measurement.</p>
      ) : (
        <>
          <div className="result-grid">
            <div className="result-card">
              <p className="choice-group-label">US Men</p>
              <p className="result-size">{formatSize(result.usMen)}</p>
            </div>
            <div className="result-card">
              <p className="choice-group-label">US Women</p>
              <p className="result-size">{formatSize(result.usWomen)}</p>
            </div>
            <div className="result-card">
              <p className="choice-group-label">UK Men</p>
              <p className="result-size">{formatSize(result.ukMen)}</p>
            </div>
            <div className="result-card">
              <p className="choice-group-label">UK Women</p>
              <p className="result-size">{formatSize(result.ukWomen)}</p>
            </div>
          </div>
          <p className="step-sub">Foot length: {(measurement.lengthMm / 10).toFixed(1)} cm</p>
          {measurement.widthMm ? <p className="step-sub">Width: {(measurement.widthMm / 10).toFixed(1)} cm</p> : null}
          {result.betweenSizes ? (
            <p className="step-sub">You're between sizes — round up for comfort and walking, down for a snug athletic fit.</p>
          ) : null}
          {widthWide ? (
            <p className="step-sub">You told us your feet feel wide: choose a wide last, or go up half a size — never size up so much the heel slips.</p>
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
