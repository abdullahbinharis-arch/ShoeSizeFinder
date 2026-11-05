import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

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
