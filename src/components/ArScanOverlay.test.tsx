import { render, screen } from '@testing-library/react';
import { ArScanOverlay } from './ArScanOverlay';

test('floor detection shows the first progress segment and movement instruction', () => {
  const { container } = render(<ArScanOverlay state="floor-detect" />);
  expect(screen.getByText('Find the floor')).toBeInTheDocument();
  expect(screen.getByText(/move your phone slowly/i)).toBeInTheDocument();
  const progress = screen.getByRole('progressbar', { name: /scan progress/i });
  expect(progress).toHaveAttribute('aria-valuemin', '1');
  expect(progress).toHaveAttribute('aria-valuemax', '4');
  expect(progress).toHaveAttribute('aria-valuenow', '1');
  const segments = container.querySelectorAll('.scan-progress-segment');
  expect(segments).toHaveLength(4);
  expect(segments[0]).toHaveClass('active');
});

test('top view shows the foot-outline instruction and marks floor detection complete', () => {
  const { container } = render(<ArScanOverlay state="top-length" />);
  expect(screen.getByText('Top view')).toBeInTheDocument();
  expect(screen.getByText(/tap your heel/i)).toBeInTheDocument();
  expect(container.querySelector('.scan-foot-outline')).not.toBeNull();
  const segments = container.querySelectorAll('.scan-progress-segment');
  expect(segments[0]).toHaveClass('done');
  expect(segments[1]).toHaveClass('active');
});

test('angled retry shows its instruction and the state-machine error', () => {
  render(<ArScanOverlay state="angled-retry" error="The two readings are 7 mm apart" />);
  expect(screen.getByText('One more check')).toBeInTheDocument();
  expect(screen.getByText(/tap heel and toe once more/i)).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('The two readings are 7 mm apart');
});
