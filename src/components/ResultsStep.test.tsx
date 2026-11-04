import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsStep } from './ResultsStep';

test('shows US and UK sizes for the chosen gender', () => {
  render(
    <ResultsStep
      gender="men"
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/Based on your larger foot: 26\.0 cm/i)).toBeInTheDocument();
  expect(screen.getByText('US 9 (men)')).toBeInTheDocument();
  expect(screen.getByText('UK 8')).toBeInTheDocument();
  expect(screen.queryByText('US 10 (women)')).not.toBeInTheDocument();
});

test('shows women sizes and both US columns', () => {
  render(
    <ResultsStep
      gender="women"
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText('US 10 (women)')).toBeInTheDocument();
  expect(screen.getByText('UK 7.5')).toBeInTheDocument();
  expect(screen.getByText(/US 9 \(men\) · US 10 \(women\)/)).toBeInTheDocument();
});

test('flags between-sizes and shows width adjustment and tips', () => {
  render(
    <ResultsStep
      gender="men"
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
      gender="men"
      measurement={{ lengthMm: 140, source: 'manual' }}
      shape={{}}
      onRestart={() => {}}
    />,
  );
  expect(screen.getByText(/outside the standard adult chart/i)).toBeInTheDocument();
  expect(screen.queryByText(/^US /)).not.toBeInTheDocument();
});

test('restart button calls onRestart', async () => {
  const user = userEvent.setup();
  const onRestart = vi.fn();
  render(
    <ResultsStep
      gender="men"
      measurement={{ lengthMm: 260, source: 'manual' }}
      shape={{}}
      onRestart={onRestart}
    />,
  );
  await user.click(screen.getByRole('button', { name: /measure again/i }));
  expect(onRestart).toHaveBeenCalled();
});
