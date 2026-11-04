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
