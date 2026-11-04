import { useState } from 'react';
import type { Gender } from '../lib/types';
import { ChoiceCard } from './ChoiceCard';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface WelcomeStepProps {
  onNext: (gender: Gender, bothFeet: boolean) => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const [gender, setGender] = useState<Gender | null>(null);
  const [bothFeet, setBothFeet] = useState(false);

  return (
    <StepShell
      title="Find your true shoe size"
      subtitle="Answer two quick questions, then measure your foot — we'll give you your US and UK sizes plus buying tips for your foot shape."
    >
      <div className="choice-group">
        <p className="choice-group-label">Which size chart should we use?</p>
        <ChoiceCard
          title="Men"
          description="US men's and UK men's sizes"
          selected={gender === 'men'}
          onSelect={() => setGender('men')}
        />
        <ChoiceCard
          title="Women"
          description="US women's and UK women's sizes"
          selected={gender === 'women'}
          onSelect={() => setGender('women')}
        />
      </div>
      <ChoiceCard
        title="Measure both feet"
        description="We'll use your larger foot for the size (recommended — most people have one foot bigger)"
        selected={bothFeet}
        onSelect={() => setBothFeet((v) => !v)}
      />
      <PrimaryButton disabled={!gender} onClick={() => onNext(gender!, bothFeet)}>
        Next
      </PrimaryButton>
    </StepShell>
  );
}
