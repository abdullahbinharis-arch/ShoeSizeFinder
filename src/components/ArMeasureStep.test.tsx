import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArMeasureStep from './ArMeasureStep';

const mocks = vi.hoisted(() => {
  const target = new EventTarget();
  const session = Object.assign(target, { end: () => Promise.resolve() }) as unknown as XRSession;
  return {
    session,
    endSession: () => target.dispatchEvent(new Event('end')),
    requestArSession: vi.fn<() => Promise<XRSession | null>>(async () => session),
    hitTestSourceFromSession: vi.fn(async () => ({ space: {} }) as unknown as XRHitTestSource),
  };
});

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class FakeWebGLRenderer {
    domElement = document.createElement('canvas');
    xr = {
      enabled: false,
      setSession: () => Promise.resolve(),
      getReferenceSpace: () => null,
    };
    setPixelRatio() {}
    setSize() {}
    setAnimationLoop() {}
    dispose() {}
    render() {}
  }
  return { ...actual, WebGLRenderer: FakeWebGLRenderer };
});

vi.mock('../lib/webxr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/webxr')>();
  return {
    ...actual,
    requestArSession: mocks.requestArSession,
    hitTestSourceFromSession: mocks.hitTestSourceFromSession,
  };
});

test('shows starting state, then failure UI when the session cannot start', async () => {
  const user = userEvent.setup();
  const onFailed = vi.fn();
  mocks.requestArSession.mockResolvedValueOnce(null);
  render(<ArMeasureStep onFailed={onFailed} onComplete={() => {}} />);
  expect(screen.getByText(/starting AR/i)).toBeInTheDocument();
  expect(await screen.findByText(/couldn't start AR/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /try typing your measurement/i }));
  expect(onFailed).toHaveBeenCalled();
});

describe('ArMeasureStep session loss', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to the typing measurement when the AR session ends mid-scan', async () => {
    const onFailed = vi.fn();
    const onComplete = vi.fn();
    render(<ArMeasureStep onFailed={onFailed} onComplete={onComplete} />);

    expect(await screen.findByText('Find the floor')).toBeInTheDocument();

    act(() => mocks.endSession());

    expect(await screen.findByRole('button', { name: /try typing your measurement/i })).toBeInTheDocument();
    expect(onFailed).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('ignores a session end that arrives after unmount', async () => {
    const { unmount } = render(<ArMeasureStep onFailed={vi.fn()} onComplete={vi.fn()} />);
    expect(await screen.findByText('Find the floor')).toBeInTheDocument();

    unmount();
    act(() => mocks.endSession());
  });
});
