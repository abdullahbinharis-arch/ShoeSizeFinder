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
      subtitle={arSupported ? 'Scan your foot with your phone — no card or paper needed.' : 'Measure your foot in under a minute.'}
    >
      {arSupported ? (
        <PrimaryButton onClick={() => onSelect('ar')}>Scan my foot</PrimaryButton>
      ) : (
        <PrimaryButton onClick={() => onSelect('manual')}>Type my measurement</PrimaryButton>
      )}
      {arSupported ? (
        <button type="button" className="btn-secondary" onClick={() => onSelect('manual')}>
          Type my measurement
        </button>
      ) : (
        <button type="button" className="btn-secondary" onClick={() => onSelect('photo')}>
          Take a photo
        </button>
      )}
    </StepShell>
  );
}
