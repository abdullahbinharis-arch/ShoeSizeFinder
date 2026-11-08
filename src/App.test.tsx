import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

afterEach(() => vi.unstubAllGlobals());

test('welcome shows photo and manual options, AR hidden without navigator.xr', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /take a photo/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /measure in AR/i })).not.toBeInTheDocument();
});

test('clicking Take a photo lands on the photo step', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /take a photo/i }));
  expect(screen.getByRole('heading', { name: /photo measurement/i })).toBeInTheDocument();
});

test('clicking Type my measurement lands on the manual step', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));
  expect(screen.getByRole('heading', { name: /type your measurement/i })).toBeInTheDocument();
});

test('welcome promotes AR and hides photo when navigator.xr supports immersive-ar', async () => {
  const xr = { isSessionSupported: vi.fn().mockResolvedValue(true) };
  vi.stubGlobal('navigator', { ...navigator, xr });

  render(<App />);

  expect(await screen.findByRole('button', { name: /scan my foot/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /take a photo/i })).not.toBeInTheDocument();
  vi.unstubAllGlobals();
});
