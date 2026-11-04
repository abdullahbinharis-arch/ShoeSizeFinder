import { describe, expect, it, vi } from 'vitest';
import { requestArSession, hitTestSourceFromSession } from './webxr';

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
