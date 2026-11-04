import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShapeQuizStep } from './ShapeQuizStep';

test('answers all questions and submits partial FootShape', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ShapeQuizStep onComplete={onComplete} onSkip={() => {}} />);
  await user.click(screen.getByRole('button', { name: /Greek/ }));
  await user.click(screen.getByRole('button', { name: /^Wide/ }));
  await user.click(screen.getByRole('button', { name: /High/ }));
  await user.click(screen.getByRole('button', { name: 'See my results' }));
  expect(onComplete).toHaveBeenCalledWith({ toe: 'greek', width: 'wide', arch: 'high' });
});

test('skipping calls onSkip', async () => {
  const user = userEvent.setup();
  const onSkip = vi.fn();
  render(<ShapeQuizStep onComplete={() => {}} onSkip={onSkip} />);
  await user.click(screen.getByRole('button', { name: /skip/i }));
  expect(onSkip).toHaveBeenCalled();
});

test('submitting with no answers sends an empty object', async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  render(<ShapeQuizStep onComplete={onComplete} onSkip={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'See my results' }));
  expect(onComplete).toHaveBeenCalledWith({});
});
