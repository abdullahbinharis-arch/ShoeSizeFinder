interface XrNavigator {
  xr?: {
    isSessionSupported(mode: string): Promise<boolean>;
    requestSession(mode: string, options?: XRSessionInit): Promise<XRSession>;
  };
}

export async function isArSupported(): Promise<boolean> {
  const xr = (navigator as Navigator & XrNavigator).xr;
  if (!xr) return false;
  try {
    return await xr.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}

export async function requestArSession(): Promise<XRSession | null> {
  const xr = (navigator as Navigator & XrNavigator).xr;
  if (!xr) return null;
  try {
    return await xr.requestSession('immersive-ar', { optionalFeatures: ['hit-test'] });
  } catch {
    return null;
  }
}

export async function hitTestSourceFromSession(session: XRSession): Promise<XRHitTestSource | null> {
  try {
    const refSpace = await session.requestReferenceSpace('local');
    return (await session.requestHitTestSource?.({ space: refSpace })) ?? null;
  } catch {
    return null;
  }
}
