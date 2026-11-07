import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { advanceArScan, initialArScanSnapshot } from '../lib/arScan';
import type { ArScanEvent, ArScanSnapshot } from '../lib/arScan';
import { mmBetweenPoints } from '../lib/distance';
import { roundToTenthMm } from '../lib/photoMeasure';
import { hitTestSourceFromSession, requestArSession } from '../lib/webxr';
import type { FootMeasurement } from '../lib/types';
import { ArScanOverlay } from './ArScanOverlay';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

type StartupPhase = 'starting' | 'ready' | 'failed';

interface ArMeasureStepProps {
  onFailed: () => void;
  onComplete: (measurement: FootMeasurement) => void;
}

const LENGTH_STATES: ArScanSnapshot['state'][] = ['top-length', 'angled-length', 'angled-retry'];

export default function ArMeasureStep({ onFailed, onComplete }: ArMeasureStepProps) {
  const [startup, setStartup] = useState<StartupPhase>('starting');
  const [scan, setScan] = useState<ArScanSnapshot>(initialArScanSnapshot);
  const holderRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef(scan);
  const pendingRef = useRef<THREE.Vector3[]>([]);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    scanRef.current = scan;
  }, [scan]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearPending = () => {
    pendingRef.current = [];
    markerGroupRef.current?.clear();
  };

  const applyEvent = (event: ArScanEvent) => {
    const transition = advanceArScan(scanRef.current, event);
    scanRef.current = transition.snapshot;
    setScan(transition.snapshot);
    if (transition.accepted) clearPending();
    if (transition.measurement) onCompleteRef.current(transition.measurement);
  };

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
        if (session) void session.end();
        setStartup('failed');
        return;
      }

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);

        const width = holderRef.current.clientWidth || window.innerWidth;
        const height = Math.min(window.innerHeight * 0.6, 420);
        renderer.setSize(width, height);
        renderer.xr.enabled = true;
        holderRef.current.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        camera.matrixAutoUpdate = false;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        const reticle = new THREE.Mesh(
          new THREE.RingGeometry(0.04, 0.05, 32).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0x00e0c6 }),
        );
        reticle.visible = false;
        scene.add(reticle);

        const markerGroup = new THREE.Group();
        scene.add(markerGroup);
        markerGroupRef.current = markerGroup;

        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
        const addMarker = (point: THREE.Vector3) => {
          const marker = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 16), markerMaterial);
          marker.position.copy(point);
          markerGroup.add(marker);
        };

        await renderer.xr.setSession(session);
        setStartup('ready');

        onSelect = () => {
          if (!reticle.visible) return;
          const state = scanRef.current.state;
          const measuringLength = LENGTH_STATES.includes(state);
          const measuringWidth = state === 'top-width';
          if (!measuringLength && !measuringWidth) return;

          const point = reticle.position.clone();
          pendingRef.current.push(point);
          addMarker(point);
          if (pendingRef.current.length < 2) return;

          const [first, second] = pendingRef.current;
          const measuredMm = roundToTenthMm(mmBetweenPoints(first, second));
          const event: ArScanEvent = measuringWidth
            ? { type: 'width', widthMm: measuredMm }
            : state === 'top-length'
              ? { type: 'top-length', lengthMm: measuredMm }
              : state === 'angled-length'
                ? { type: 'angled-length', lengthMm: measuredMm }
                : { type: 'angled-retry-length', lengthMm: measuredMm };

          const transition = advanceArScan(scanRef.current, event);
          scanRef.current = transition.snapshot;
          setScan(transition.snapshot);
          clearPending();
          if (transition.measurement) onCompleteRef.current(transition.measurement);
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
              if (scanRef.current.state === 'floor-detect') {
                const transition = advanceArScan(scanRef.current, { type: 'floor-ready' });
                scanRef.current = transition.snapshot;
                setScan(transition.snapshot);
                clearPending();
              }
            }
          } else {
            reticle.visible = false;
          }
          renderer!.render(scene, camera);
        });
      } catch {
        if (session) void session.end();
        if (!disposed) setStartup('failed');
      }
    })();

    return () => {
      disposed = true;
      if (session && onSelect) session.removeEventListener('select', onSelect);
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        renderer.domElement.parentElement?.removeChild(renderer.domElement);
      }
      if (session) void session.end();
      markerGroupRef.current = null;
    };
  }, []);

  if (startup === 'failed') {
    return (
      <StepShell title="Couldn't start AR" subtitle="Your browser or device doesn't support in-browser AR measuring. Try typing your measurement instead.">
        <PrimaryButton onClick={onFailed}>Try typing your measurement</PrimaryButton>
      </StepShell>
    );
  }

  return (
    <StepShell title="Scan your foot">
      <div className="ar-stage">
        <div ref={holderRef} className="ar-canvas-holder" />
        {startup === 'ready' ? (
          <ArScanOverlay state={scan.state} error={scan.error} />
        ) : (
          <div className="ar-starting">Starting AR…</div>
        )}
      </div>
      {scan.topLengthMm !== null ? <p className="measure-readout">Length: {(scan.topLengthMm / 10).toFixed(1)} cm</p> : null}
      {scan.widthMm !== null ? <p className="measure-readout">Width: {(scan.widthMm / 10).toFixed(1)} cm</p> : null}
      {scan.state === 'top-width' ? (
        <PrimaryButton onClick={() => applyEvent({ type: 'skip-width' })}>Skip width — continue</PrimaryButton>
      ) : null}
      {scan.state === 'angled-retry' ? (
        <button type="button" className="btn-secondary" onClick={() => applyEvent({ type: 'restart-top' })}>
          Retake top view
        </button>
      ) : null}
    </StepShell>
  );
}
