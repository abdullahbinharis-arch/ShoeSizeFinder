import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualEntryStep } from './ManualEntryStep';

test('accepts a valid cm value and reports mm', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ManualEntryStep onComplete={onComplete} />);
  await user.type(screen.getByLabelText(/foot length/i), '26.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(onComplete).toHaveBeenCalledWith({ lengthMm: 264, source: 'manual' });
});

test('rejects out-of-range values with an inline error', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ManualEntryStep onComplete={onComplete} />);
  await user.type(screen.getByLabelText(/foot length/i), '9');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText(/between 10 and 40 cm/i)).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});

test('rejects non-numeric input', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ManualEntryStep onComplete={onComplete} />);
  await user.type(screen.getByLabelText(/foot length/i), 'abc');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText(/valid number/i)).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});
