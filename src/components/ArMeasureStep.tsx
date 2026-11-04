import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { mmBetweenPoints } from '../lib/distance';
import { isPlausibleLength, roundToTenthMm } from '../lib/photoMeasure';
import { hitTestSourceFromSession, requestArSession } from '../lib/webxr';
import type { FootMeasurement, FootSide } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

type Phase = 'starting' | 'placing' | 'failed';

interface ArMeasureStepProps {
  side: FootSide;
  onFailed: () => void;
  onComplete: (measurement: FootMeasurement) => void;
}

export default function ArMeasureStep({ side, onFailed, onComplete }: ArMeasureStepProps) {
  const [phase, setPhase] = useState<Phase>('starting');
  const [status, setStatus] = useState('Move your phone slowly to detect the floor, then tap to mark your heel.');
  const [lengthMm, setLengthMm] = useState(0);
  const [widthMm, setWidthMm] = useState<number | null>(null);
  const [canFinish, setCanFinish] = useState(false);
  const holderRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ points: THREE.Vector3[]; measuringWidth: boolean; length: number; width: number | null }>({
    points: [],
    measuringWidth: false,
    length: 0,
    width: null,
  });

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let session: XRSession | null = null;
    let onSelect: (() => void) | null = null;

    (async () => {
      session = await requestArSession();
      const hitSource = session ? await hitTestSourceFromSession(session) : null;
      if (disposed) {
        if (session) void session.end();
        return;
      }
      if (!session || !hitSource || !holderRef.current) {
        setPhase('failed');
        return;
      }

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, Math.min(window.innerHeight * 0.6, 480));
      renderer.xr.enabled = true;
      holderRef.current.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      camera.matrixAutoUpdate = false;

      const reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.05, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x00b39a }),
      );
      reticle.visible = false;
      scene.add(reticle);

      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
      const addMarker = (p: THREE.Vector3) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 16), markerMaterial);
        m.position.copy(p);
        scene.add(m);
      };

      await renderer.xr.setSession(session);
      setPhase('placing');

      onSelect = () => {
        if (!reticle.visible) return;
        const s = stateRef.current;
        const p = reticle.position.clone();
        s.points.push(p);
        addMarker(p);
        if (!s.measuringWidth && s.points.length === 1) {
          setStatus('Now move to the tip of your longest toe and tap again.');
          return;
        }
        if (!s.measuringWidth && s.points.length === 2) {
          const mm = roundToTenthMm(mmBetweenPoints(s.points[0], s.points[1]));
          if (!isPlausibleLength(mm)) {
            setStatus(`That came out to ${(mm / 10).toFixed(1)} cm — likely a bad tap. Re-aim at heel and toe.`);
            s.points = [];
            return;
          }
          s.length = mm;
          setLengthMm(mm);
          setStatus('Length locked in. Optionally: tap the two widest points of your foot.');
          s.measuringWidth = true;
          s.points = [];
          return;
        }
        if (s.measuringWidth && s.points.length === 2) {
          const mm = roundToTenthMm(mmBetweenPoints(s.points[0], s.points[1]));
          s.width = isPlausibleLength(mm) ? mm : null;
          setWidthMm(s.width);
          setCanFinish(true);
          setStatus('All set — see your results.');
          s.measuringWidth = false;
          s.points = [];
        }
      };
      session.addEventListener('select', onSelect);

      renderer.setAnimationLoop((_time, frame) => {
        if (!frame) return;
        camera.updateMatrixWorld();
        const results = frame.getHitTestResults(hitSource);
        if (results.length > 0) {
          const pose = results[0].getPose(renderer!.xr.getReferenceSpace()!);
          if (pose) {
            reticle.visible = true;
            reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
          }
        } else {
          reticle.visible = false;
        }
        renderer!.render(scene, camera);
      });
    })();

    return () => {
      disposed = true;
      if (session && onSelect) session.removeEventListener('select', onSelect);
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
      }
      if (session) void session.end();
    };
  }, []);

  if (phase === 'failed') {
    return (
      <StepShell title="Couldn't start AR" subtitle="Your browser or device doesn't support in-browser AR measuring. Try the photo method instead.">
        <PrimaryButton onClick={onFailed}>Back</PrimaryButton>
      </StepShell>
    );
  }

  return (
    <StepShell title={`AR measurement — ${side} foot`} subtitle={status}>
      {phase === 'starting' ? <p className="step-sub">Starting AR…</p> : null}
      <div ref={holderRef} />
      {lengthMm > 0 ? <p className="measure-readout">Length: {(lengthMm / 10).toFixed(1)} cm</p> : null}
      {widthMm !== null ? <p className="measure-readout">Width: {(widthMm / 10).toFixed(1)} cm</p> : null}
      {lengthMm > 0 ? (
        canFinish || widthMm !== null ? (
          <PrimaryButton onClick={() => onComplete({ lengthMm, widthMm: widthMm ?? undefined, source: 'ar' })}>
            Continue
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => { stateRef.current.measuringWidth = false; setCanFinish(true); setStatus('All set — see your results.'); }}>
            Skip width — continue
          </PrimaryButton>
        )
      ) : null}
    </StepShell>
  );
}
