import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders the wizard welcome screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /find your true shoe size/i })).toBeInTheDocument();
});
