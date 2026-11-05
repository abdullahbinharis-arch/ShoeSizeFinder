import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { isPlausibleReference, pxPerMm, pxToMm } from '../lib/calibrate';
import { pxDistance } from '../lib/distance';
import { isPlausibleLength, roundToTenthMm } from '../lib/photoMeasure';
import type { FootMeasurement, Point } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

type Phase = 'source' | 'guide' | 'reference' | 'length' | 'width' | 'error';

const REFERENCES = [
  { label: 'Credit card — short edge (54.0 mm)', mm: 53.98 },
  { label: 'Credit card — long edge (85.6 mm)', mm: 85.6 },
  { label: 'A4 paper — short edge (210 mm)', mm: 210 },
  { label: 'Letter paper — short edge (216 mm)', mm: 216 },
];

interface PhotoMeasureStepProps {
  onComplete: (measurement: FootMeasurement) => void;
}

export function PhotoMeasureStep({ onComplete }: PhotoMeasureStepProps) {
  const [phase, setPhase] = useState<Phase>('source');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [refMm, setRefMm] = useState(REFERENCES[0].mm);
  const [taps, setTaps] = useState<Point[]>([]);
  const [scale, setScale] = useState(0); // px per mm derived from the reference taps
  const [lengthMm, setLengthMm] = useState(0);
  const [widthMm, setWidthMm] = useState<number | null>(null);
  const [error, setError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const startOver = useCallback(() => {
    setTaps([]);
    setScale(0);
    setLengthMm(0);
    setWidthMm(null);
    setError('');
    setPhase(imageUrl ? 'reference' : 'source');
  }, [imageUrl]);

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setPhase('guide');
  };

  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    if (phase !== 'reference' && phase !== 'width' && !(phase === 'length' && lengthMm === 0)) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const next = [...taps, point];
    setTaps(next);

    if (phase === 'reference' && next.length === 2) {
      const refPx = pxDistance(next[0], next[1]);
      if (!isPlausibleReference(refPx)) {
        setError('Reference points are too close together — re-tap at the two ends of the edge, or use a bigger reference.');
        setPhase('error');
        return;
      }
      setScale(pxPerMm(refPx, refMm));
      setTaps([]);
      setPhase('length');
      return;
    }

    if (phase === 'length' && next.length === 2) {
      const mm = roundToTenthMm(pxToMm(pxDistance(next[0], next[1]), scale));
      if (!isPlausibleLength(mm)) {
        setError(`That works out to ${(mm / 10).toFixed(1)} cm, which doesn't look right — re-tap heel and toe carefully.`);
        setPhase('error');
        return;
      }
      setLengthMm(mm);
      setTaps([]);
      return;
    }

    if (phase === 'width' && next.length === 2) {
      const mm = roundToTenthMm(pxToMm(pxDistance(next[0], next[1]), scale));
      setWidthMm(isPlausibleLength(mm) ? mm : null);
      setTaps([]);
      return;
    }
  };

  const finish = () => {
    onComplete({ lengthMm, widthMm: widthMm ?? undefined, source: 'photo' });
  };

  const instruction = useMemo(() => {
    if (phase === 'reference') return 'Tap two points on your reference — the two ends of the edge you chose.';
    if (phase === 'length') return taps.length === 0 ? 'Tap the center of your heel.' : 'Now tap the tip of your longest toe.';
    if (phase === 'width') return taps.length === 0 ? 'Optional: tap one side of the widest part of your foot.' : 'Tap the other side at the same width.';
    return '';
  }, [phase, taps.length]);

  if (phase === 'source') {
    return (
      <StepShell title="Photo measurement" subtitle="We'll guide you through one photo. Bare foot, a credit card or paper beside it.">
        <p className="step-sub">Your photo never leaves your device.</p>
        <label className="choice-card">
          <span className="choice-title">Take a photo</span>
          <span className="choice-desc">Opens your camera</span>
          <input
            aria-label="Take a photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="text-input"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />
        </label>
        <label className="choice-card">
          <span className="choice-title">Upload a photo</span>
          <span className="choice-desc">Pick an existing picture</span>
          <input
            aria-label="Upload a photo"
            type="file"
            accept="image/*"
            className="text-input"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />
        </label>
      </StepShell>
    );
  }

  if (phase === 'guide') {
    return (
      <StepShell title="Get the shot right" subtitle="Accuracy depends on this — 20 seconds of care beats a re-do.">
        <ul className="step-sub">
          <li>Take a top-down photo: phone directly above, parallel to the floor.</li>
          <li>Bare foot, standing with full weight on it — measure your larger foot if you know which it is.</li>
          <li>Place a credit card or A4/Letter paper flat beside your foot, fully in frame.</li>
          <li>Good light, no shadows across the foot.</li>
        </ul>
        <PrimaryButton onClick={() => setPhase('reference')}>Start measuring</PrimaryButton>
      </StepShell>
    );
  }

  if (phase === 'error') {
    return (
      <StepShell title="Hmm, that doesn't look right" subtitle={error}>
        <PrimaryButton onClick={startOver}>Start over</PrimaryButton>
      </StepShell>
    );
  }

  return (
    <StepShell title="Tap on the photo" subtitle={instruction}>
      <label>
        <span className="choice-group-label">Reference used</span>
        <select
          className="text-input"
          aria-label="Reference object"
          value={refMm}
          disabled={phase !== 'reference'}
          onChange={(e) => setRefMm(Number(e.target.value))}
        >
          {REFERENCES.map((r) => (
            <option key={r.label} value={r.mm}>{r.label}</option>
          ))}
        </select>
      </label>
      {imageUrl ? (
        <div ref={wrapRef} className="tap-image-wrap" onClick={handleTap}>
          <img src={imageUrl} alt="Foot with reference object" />
          {taps.map((p, i) => (
            <span key={i} className="tap-marker" style={{ left: p.x, top: p.y }} />
          ))}
        </div>
      ) : null}
      {lengthMm > 0 ? <p className="measure-readout">Length: {(lengthMm / 10).toFixed(1)} cm</p> : null}
      {widthMm !== null ? <p className="measure-readout">Width: {(widthMm / 10).toFixed(1)} cm</p> : null}
      {lengthMm > 0 && widthMm === null ? (
        <>
          <PrimaryButton onClick={() => setPhase('width')}>Add width (optional)</PrimaryButton>
          <PrimaryButton onClick={finish}>Skip width — continue</PrimaryButton>
        </>
      ) : null}
      {lengthMm > 0 && widthMm !== null ? <PrimaryButton onClick={finish}>Continue</PrimaryButton> : null}
    </StepShell>
  );
}
