import type { MeasureMethod } from '../lib/types';
import { ChoiceCard } from './ChoiceCard';
import { StepShell } from './StepShell';

interface MethodStepProps {
  arSupported: boolean;
  onSelect: (method: MeasureMethod) => void;
}

export function MethodStep({ arSupported, onSelect }: MethodStepProps) {
  return (
    <StepShell
      title="How do you want to measure?"
      subtitle="Pick whichever is easiest — all three give the same accurate result."
    >
      <div className="choice-group">
        <ChoiceCard
          title="I'll type my measurement"
          description="Use your phone's Measure app or a ruler, then enter the length — fastest, works on every device"
          selected={false}
          onSelect={() => onSelect('manual')}
        />
        <ChoiceCard
          title="Measure from a photo"
          description="Take a top-down photo with a credit card or paper beside your foot — takes about 30 seconds"
          selected={false}
          onSelect={() => onSelect('photo')}
        />
        {arSupported ? (
          <ChoiceCard
            title="AR measure"
            description="Point your camera at your foot and tap heel and toe — no reference object needed"
            selected={false}
            onSelect={() => onSelect('ar')}
          />
        ) : null}
      </div>
    </StepShell>
  );
}
