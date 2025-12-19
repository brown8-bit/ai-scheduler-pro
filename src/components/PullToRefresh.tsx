import { ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh = ({ onRefresh, children, className = '', disabled = false }: PullToRefreshProps) => {
  const { containerRef, pullDistance, isRefreshing, progress, shouldTrigger } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-y-auto overflow-x-hidden overscroll-y-contain ${className}`}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      {/* Pull indicator - only show on mobile */}
      <div 
        className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20 transition-all duration-200"
        style={{ 
          top: Math.max(8, pullDistance - 50),
          opacity: progress > 0.1 ? Math.min(progress * 1.5, 1) : 0,
          transform: `scale(${0.6 + progress * 0.4})`,
        }}
      >
        <div className={`p-2.5 rounded-full bg-background border border-border shadow-lg ${isRefreshing ? 'animate-pulse' : ''}`}>
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <RefreshCw 
              className={`w-5 h-5 text-primary transition-transform duration-300 ${shouldTrigger ? 'rotate-180' : ''}`}
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
          )}
        </div>
      </div>
      
      {/* Content wrapper */}
      <div 
        className="min-h-full"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : 'none',
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
