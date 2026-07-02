import { type ReactNode } from 'react';
import { ErrorState } from './error-state';

interface QueryBoundaryProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Skeleton shown while loading. */
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * Detail-page loading/error gate. Keeps the skeleton mounted until data is
 * truly ready to avoid flashing stale/empty content.
 */
export function QueryBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  fallback,
  children,
}: QueryBoundaryProps) {
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  if (isLoading) return <>{fallback}</>;
  return <>{children}</>;
}
