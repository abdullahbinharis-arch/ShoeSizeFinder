interface XrNavigator {
  xr?: { isSessionSupported(mode: string): Promise<boolean> };
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
