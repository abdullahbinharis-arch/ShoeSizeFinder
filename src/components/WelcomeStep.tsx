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
      subtitle="Measure your foot in under a minute — no reference object needed for AR."
    >
      <PrimaryButton onClick={() => onSelect('photo')}>Take a photo</PrimaryButton>
      {arSupported ? (
        <button type="button" className="btn-secondary" onClick={() => onSelect('ar')}>
          Measure in AR
        </button>
      ) : null}
      <button type="button" className="btn-secondary" onClick={() => onSelect('manual')}>
        Type my measurement
      </button>
    </StepShell>
  );
}
