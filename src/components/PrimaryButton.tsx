import type { ComponentPropsWithoutRef } from 'react';

export function PrimaryButton(props: ComponentPropsWithoutRef<'button'>) {
  return <button type="button" className="btn-primary" {...props} />;
}
