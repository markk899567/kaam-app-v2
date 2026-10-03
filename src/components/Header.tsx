import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
}

export function Header({ title, onBack, right, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-cream-white/95 backdrop-blur-sm border-b border-olive-light/20">
      <div className="flex items-center gap-3 px-4 h-14">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-olive-lighter/50 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-kaam-text" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-kaam-text truncate">{title}</h1>
          {subtitle && <p className="text-xs text-kaam-muted truncate">{subtitle}</p>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </header>
  );
}
