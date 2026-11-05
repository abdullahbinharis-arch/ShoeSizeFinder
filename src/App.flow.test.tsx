import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function gridValue(label: string): string | null {
  const card = screen.getByText(label).closest('.result-card');
  expect(card).not.toBeNull();
  const value = within(card as HTMLElement).getByText(/^[0-9.]+$/);
  return value.textContent;
}

test('full wizard: type-in 26.4 cm, skip quiz, results show all four size columns', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /type my measurement/i }));

  await user.type(screen.getByLabelText(/foot length/i), '26.4');
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  await user.click(screen.getByRole('button', { name: /skip/i }));

  expect(screen.getByRole('heading', { name: 'Your shoe size' })).toBeInTheDocument();
  expect(gridValue('US Men')).toBe('9');
  expect(gridValue('US Women')).toBe('10');
  expect(gridValue('UK Men')).toBe('8');
  expect(gridValue('UK Women')).toBe('7.5');
  expect(screen.getByText(/end of the day/i)).toBeInTheDocument();
});
