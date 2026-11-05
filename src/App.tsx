import { useEffect, useState } from 'react';
import ArMeasureStep from './components/ArMeasureStep';
import { ManualEntryStep } from './components/ManualEntryStep';
import { PhotoMeasureStep } from './components/PhotoMeasureStep';
import { ResultsStep } from './components/ResultsStep';
import { ShapeQuizStep } from './components/ShapeQuizStep';
import { WelcomeStep } from './components/WelcomeStep';
import { isArSupported } from './lib/webxr';
import type { FootMeasurement, FootShape, MeasureMethod } from './lib/types';

type Step = 'welcome' | 'manual' | 'photo' | 'ar' | 'shape' | 'results';

export default function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [method, setMethod] = useState<MeasureMethod>('manual');
  const [measurement, setMeasurement] = useState<FootMeasurement | null>(null);
  const [shapeAnswers, setShapeAnswers] = useState<Partial<FootShape>>({});
  const [arSupported, setArSupported] = useState(false);

  useEffect(() => {
    void isArSupported().then(setArSupported);
  }, []);

  const handleMeasured = (m: FootMeasurement) => {
    setMeasurement(m);
    setStep('shape');
  };

  const resetWizard = () => {
    setStep('welcome');
    setMeasurement(null);
    setShapeAnswers({});
  };

  return (
    <>
      {step === 'welcome' ? (
        <WelcomeStep
          arSupported={arSupported}
          onSelect={(m) => {
            setMethod(m);
            setStep(m);
          }}
        />
      ) : null}
      {step === 'manual' ? <ManualEntryStep onComplete={handleMeasured} /> : null}
      {step === 'photo' ? <PhotoMeasureStep onComplete={handleMeasured} /> : null}
      {step === 'ar' ? <ArMeasureStep onFailed={() => setStep('welcome')} onComplete={handleMeasured} /> : null}
      {step === 'shape' ? <ShapeQuizStep onComplete={(a) => { setShapeAnswers(a); setStep('results'); }} onSkip={() => setStep('results')} /> : null}
      {step === 'results' && measurement ? (
        <ResultsStep measurement={measurement} shape={shapeAnswers} onRestart={resetWizard} />
      ) : null}
    </>
  );
}
