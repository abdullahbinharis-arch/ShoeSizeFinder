import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('full wizard: men, type-in 26.4 cm, skip quiz, results show US 9 / UK 8', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /^Men/ }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));

  await user.type(screen.getByLabelText(/foot length/i), '26.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  await user.click(screen.getByRole('button', { name: /skip/i }));

  expect(screen.getByRole('heading', { name: 'Your shoe size' })).toBeInTheDocument();
  expect(screen.getByText('US 9 (men)')).toBeInTheDocument();
  expect(screen.getByText('UK 8')).toBeInTheDocument();
  expect(screen.getByText(/end of the day/i)).toBeInTheDocument();
});

test('both-feet mode uses the larger foot for results', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /^Men/ }));
  await user.click(screen.getByRole('button', { name: /measure both feet/i }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));

  // Left foot: 25.4 cm (US 8). Continue → routed back to method step for right foot.
  await user.type(screen.getByLabelText(/foot length/i), '25.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('heading', { name: 'How do you want to measure?' })).toBeInTheDocument();

  // Right foot: 26.4 cm (US 9) — larger, so results must show US 9.
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));
  await user.type(screen.getByLabelText(/foot length/i), '26.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: /skip/i }));

  expect(screen.getByText('US 9 (men)')).toBeInTheDocument();
});
