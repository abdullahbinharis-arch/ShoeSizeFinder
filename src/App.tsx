import { useEffect, useState } from 'react';
import ArMeasureStep from './components/ArMeasureStep';
import { ManualEntryStep } from './components/ManualEntryStep';
import { MethodStep } from './components/MethodStep';
import { PhotoMeasureStep } from './components/PhotoMeasureStep';
import { WelcomeStep } from './components/WelcomeStep';
import { isArSupported } from './lib/webxr';
import type { FootMeasurement, FootShape, FootSide, Gender, MeasureMethod } from './lib/types';

type Step = 'welcome' | 'method' | 'manual' | 'photo' | 'ar' | 'shape' | 'results';

export default function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [gender, setGender] = useState<Gender>('men');
  const [bothFeet, setBothFeet] = useState(false);
  const [measurements, setMeasurements] = useState<Partial<Record<FootSide, FootMeasurement>>>({});
  const [activeFoot, setActiveFoot] = useState<FootSide>('left');
  const [shapeAnswers, setShapeAnswers] = useState<Partial<FootShape>>({});
  const [arSupported, setArSupported] = useState(false);

  useEffect(() => {
    void isArSupported().then(setArSupported);
  }, []);

  const handleMeasured = (measurement: FootMeasurement) => {
    setMeasurements((prev) => ({ ...prev, [activeFoot]: measurement }));
    if (bothFeet && activeFoot === 'left') {
      setActiveFoot('right');
      setStep('method');
    } else {
      setStep('shape');
    }
  };

  return (
    <>
      {step === 'welcome' ? (
        <WelcomeStep
          onNext={(g, both) => {
            setGender(g);
            setBothFeet(both);
            setStep('method');
          }}
        />
      ) : null}
      {step === 'method' ? <MethodStep arSupported={arSupported} onSelect={(m) => setStep(m)} /> : null}
      {step === 'manual' ? <ManualEntryStep side={activeFoot} onComplete={handleMeasured} /> : null}
      {step === 'photo' ? <PhotoMeasureStep side={activeFoot} onComplete={handleMeasured} /> : null}
      {step === 'ar' ? <ArMeasureStep side={activeFoot} onFailed={() => setStep('method')} onComplete={handleMeasured} /> : null}
      {step === 'shape' ? <p>TODO step: shape</p> : null}
      {step === 'results' ? <p>TODO step: results</p> : null}
    </>
  );
}
