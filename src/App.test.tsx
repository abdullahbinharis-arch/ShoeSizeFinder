import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

async function startWizard(gender: 'Men' | 'Women' = 'Men') {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Men/ }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  return user;
}

test('welcome asks gender then shows measurement methods', async () => {
  const user = await startWizard();
  expect(screen.getByRole('heading', { name: 'How do you want to measure?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /type my measurement/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /measure from a photo/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /AR measure/i })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));
  expect(screen.getByRole('heading', { name: /type your measurement/i })).toBeInTheDocument();
});

test('Next is disabled until a gender is chosen', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: /Women/ }));
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
});

test('both-feet toggle routes back to method step for the second foot', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Men/ }));
  await user.click(screen.getByRole('button', { name: /measure both feet/i }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: /type my measurement/i }));
  expect(screen.getByRole('heading', { name: /type your measurement/i })).toBeInTheDocument();
});
