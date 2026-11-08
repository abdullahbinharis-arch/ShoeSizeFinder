import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeStep } from './WelcomeStep';

test('shows the global retail brand mark', () => {
  render(<WelcomeStep arSupported={false} onSelect={() => {}} />);
  expect(screen.getByTestId('brand-mark')).toHaveTextContent('ShoeSizeFinder');
  expect(screen.getByRole('main')).toBeInTheDocument();
});

test('supported devices show premium scan and type-in method cards', () => {
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  expect(screen.getByRole('button', { name: /scan my foot/i })).toBeInTheDocument();
  expect(screen.getByText(/camera-guided scan/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.getByText(/already know your foot length/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /take a photo/i })).not.toBeInTheDocument();
});

test('unsupported devices keep type-in primary and photo as fallback', () => {
  render(<WelcomeStep arSupported={false} onSelect={() => {}} />);

  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /take a photo/i })).toBeInTheDocument();
  expect(screen.getByText(/use a card or paper reference/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /scan my foot/i })).not.toBeInTheDocument();
});

test('clicking Scan my foot selects the AR method', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  await user.click(screen.getByRole('button', { name: /scan my foot/i }));
  expect(onSelect).toHaveBeenCalledWith('ar');
});
