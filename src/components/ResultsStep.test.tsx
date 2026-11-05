import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsStep } from './ResultsStep';

function gridValue(label: string): string | null {
  const card = screen.getByText(label).closest('.result-card');
  expect(card).not.toBeNull();
  const value = within(card as HTMLElement).getByText(/^[0-9.]+$/);
  return value.textContent;
}

test('shows all four size columns in the grid', () => {
  render(
    <ResultsStep
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/Based on your foot: 26\.0 cm/i)).toBeInTheDocument();
  expect(gridValue('US Men')).toBe('9');
  expect(gridValue('US Women')).toBe('10');
  expect(gridValue('UK Men')).toBe('8');
  expect(gridValue('UK Women')).toBe('7.5');
  expect(screen.getByText(/foot length: 26\.0 cm/i)).toBeInTheDocument();
});

test('shows measured width when provided', () => {
  render(
    <ResultsStep
      measurement={{ lengthMm: 260, widthMm: 100, source: 'photo' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/width: 10\.0 cm/i)).toBeInTheDocument();
});

test('flags between-sizes and shows width adjustment and tips', () => {
  render(
    <ResultsStep
      measurement={{ lengthMm: 232, widthMm: 110, source: 'photo' }}
      shape={{ toe: 'greek', width: 'wide', arch: 'high' }}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/between sizes/i)).toBeInTheDocument();
  expect(screen.getByText(/wide-fit/i)).toBeInTheDocument();
  expect(screen.getByText(/second toe is longest/i)).toBeInTheDocument();
  expect(screen.getByText(/cushioned midsoles/i)).toBeInTheDocument();
  expect(screen.getByText(/end of the day/i)).toBeInTheDocument();
});

test('shows out-of-range message instead of sizes', () => {
  render(
    <ResultsStep
      measurement={{ lengthMm: 140, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/outside the standard adult chart/i)).toBeInTheDocument();
  expect(screen.queryByText('US Men')).not.toBeInTheDocument();
});

test('restart button calls onRestart', async () => {
  const user = userEvent.setup();
  const onRestart = vi.fn();
  render(
    <ResultsStep
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={onRestart}
    />,
  );
  await user.click(screen.getByRole('button', { name: /measure again/i }));
  expect(onRestart).toHaveBeenCalled();
});
