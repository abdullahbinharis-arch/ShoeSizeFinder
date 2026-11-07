import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArMeasureStep from './ArMeasureStep';

test('shows starting state, then failure UI when the session cannot start', async () => {
  const user = userEvent.setup();
  const onFailed = vi.fn();
  render(<ArMeasureStep onFailed={onFailed} onComplete={() => {}} />);
  expect(screen.getByText(/starting AR/i)).toBeInTheDocument();
  expect(await screen.findByText(/couldn't start AR/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /try typing your measurement/i }));
  expect(onFailed).toHaveBeenCalled();
});
