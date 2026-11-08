import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ChoiceCard } from './ChoiceCard';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

test('PrimaryButton renders label and click handler', async () => {
  const user = userEvent.setup();
  let clicked = false;
  render(<PrimaryButton onClick={() => { clicked = true; }}>Go</PrimaryButton>);
  await user.click(screen.getByRole('button', { name: 'Go' }));
  expect(clicked).toBe(true);
});

test('ChoiceCard shows title, description, and selected state', () => {
  render(<ChoiceCard title="Men" description="Men's size chart" selected onSelect={() => {}} />);
  const card = screen.getByRole('button', { name: /Men/ });
  expect(card).toHaveClass('selected');
  expect(card).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText("Men's size chart")).toBeInTheDocument();
});

test('ChoiceCard without description omits the desc element', () => {
  render(<ChoiceCard title="Women" selected={false} onSelect={() => {}} />);
  expect(screen.queryByText(/chart/)).not.toBeInTheDocument();
});

test('ChoiceCard can render as a one-shot action without toggle semantics', () => {
  render(<ChoiceCard title="Scan my foot" selected={false} toggle={false} onSelect={() => {}} />);
  expect(screen.getByRole('button', { name: /scan my foot/i })).not.toHaveAttribute('aria-pressed');
});

test('StepShell renders title and subtitle', () => {
  render(<StepShell title="Welcome" subtitle="Pick one"><p>body</p></StepShell>);
  expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  expect(screen.getByText('Pick one')).toBeInTheDocument();
  expect(screen.getByText('body')).toBeInTheDocument();
});

test('app shell renders the neutral brand header', () => {
  render(<App />);
  expect(screen.getByTestId('brand-mark')).toHaveTextContent('ShoeSizeFinder');
});
