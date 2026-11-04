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
