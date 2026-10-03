import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="w-8 h-8 text-olive animate-spin mb-3" />
      <p className="text-sm text-kaam-muted">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 text-kaam-muted">{icon}</div>}
      <h3 className="text-sm font-semibold text-kaam-text mb-1">{title}</h3>
      {description && <p className="text-xs text-kaam-muted mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-sm text-kaam-text mb-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-3 text-sm">
          Try Again
        </button>
      )}
    </div>
  );
}
