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
