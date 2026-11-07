import { describe, expect, it, vi } from 'vitest';
import { requestArSession, hitTestSourceFromSession, subscribeToSessionEnd } from './webxr';

describe('requestArSession', () => {
  it('returns null when navigator.xr is absent', async () => {
    expect(await requestArSession()).toBeNull();
  });

  it('returns null when requestSession rejects', async () => {
    const xr = { requestSession: vi.fn().mockRejectedValue(new Error('no ar')) };
    vi.stubGlobal('navigator', { ...navigator, xr });
    expect(await requestArSession()).toBeNull();
    vi.unstubAllGlobals();
  });

  it('passes immersive-ar and hit-test to requestSession', async () => {
    const requestSession = vi.fn().mockResolvedValue({} as XRSession);
    const xr = { requestSession };
    vi.stubGlobal('navigator', { ...navigator, xr });
    await requestArSession();
    expect(requestSession).toHaveBeenCalledWith('immersive-ar', { optionalFeatures: ['hit-test'] });
    vi.unstubAllGlobals();
  });
});

describe('hitTestSourceFromSession', () => {
  it('returns null when reference space request rejects', async () => {
    const session = { requestReferenceSpace: vi.fn().mockRejectedValue(new Error('x')) } as unknown as XRSession;
    expect(await hitTestSourceFromSession(session)).toBeNull();
  });

  it('requests a hit-test source on the local space', async () => {
    const requestHitTestSource = vi.fn().mockResolvedValue({ id: 1 });
    const session = {
      requestReferenceSpace: vi.fn().mockResolvedValue({}),
      requestHitTestSource,
    } as unknown as XRSession;
    expect(await hitTestSourceFromSession(session)).toEqual({ id: 1 });
    expect(requestHitTestSource).toHaveBeenCalledWith({ space: {} });
  });
});

describe('subscribeToSessionEnd', () => {
  function fakeSession() {
    const target = new EventTarget();
    return {
      session: target as unknown as XRSession,
      end: () => target.dispatchEvent(new Event('end')),
    };
  }

  it('adds an end listener on the session', () => {
    const { session } = fakeSession();
    const onEnded = vi.fn();
    subscribeToSessionEnd(session, onEnded);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it('invokes the callback when the session ends', () => {
    const { session, end } = fakeSession();
    const onEnded = vi.fn();
    subscribeToSessionEnd(session, onEnded);
    end();
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('stops invoking the callback after unsubscribe', () => {
    const { session, end } = fakeSession();
    const onEnded = vi.fn();
    const unsubscribe = subscribeToSessionEnd(session, onEnded);
    unsubscribe();
    end();
    expect(onEnded).not.toHaveBeenCalled();
  });
});
