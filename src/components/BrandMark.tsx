export function BrandMark() {
  return (
    <div className="brand-mark" data-testid="brand-mark" aria-label="ShoeSizeFinder">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M24 7c5.6 1.2 8.7 5.2 8.7 11.1 0 7.4-3.4 10.4-3.4 16.4 0 5.2 2.3 6.8-.8 8.9-2.2 1.5-7.8 1.5-10 0-3.1-2.1-.8-3.7-.8-8.9 0-6-3.4-9-3.4-16.4C14.3 12.2 18.4 8.2 24 7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M19 19h10M20 27h8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span>ShoeSizeFinder</span>
    </div>
  );
}
