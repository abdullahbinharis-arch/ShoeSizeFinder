import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeStep } from './WelcomeStep';

test('supported devices show Scan my foot first and hide the card-referenced photo option', () => {
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  expect(screen.getByRole('button', { name: 'Scan my foot' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Type my measurement' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Take a photo' })).not.toBeInTheDocument();
});

test('unsupported devices keep type-in primary and photo as fallback', () => {
  render(<WelcomeStep arSupported={false} onSelect={() => {}} />);

  expect(screen.getByRole('button', { name: 'Type my measurement' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Take a photo' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Scan my foot' })).not.toBeInTheDocument();
});

test('clicking Scan my foot selects the AR method', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<WelcomeStep arSupported onSelect={onSelect} />);

  await user.click(screen.getByRole('button', { name: 'Scan my foot' }));
  expect(onSelect).toHaveBeenCalledWith('ar');
});
