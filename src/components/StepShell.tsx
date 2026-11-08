import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';

interface StepShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function StepShell({ title, subtitle, children }: StepShellProps) {
  return (
    <div className="app-shell">
      <header className="brand-header">
        <BrandMark />
      </header>
      <main className="step">
        <h1 className="step-title">{title}</h1>
        {subtitle ? <p className="step-sub">{subtitle}</p> : null}
        {children}
      </main>
    </div>
  );
}
