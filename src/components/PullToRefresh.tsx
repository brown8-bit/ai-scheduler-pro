import { ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className = '' }: PullToRefreshProps) => {
  const { containerRef, pullDistance, isRefreshing, progress, shouldTrigger } = usePullToRefresh({
    onRefresh,
  });

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-auto overscroll-contain ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-200"
        style={{ 
          top: -60 + pullDistance,
          opacity: progress,
          transform: `scale(${0.5 + progress * 0.5})`,
        }}
      >
        <div className={`p-3 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 shadow-lg ${isRefreshing ? 'animate-pulse' : ''}`}>
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <ArrowDown 
              className={`w-5 h-5 text-primary transition-transform duration-200 ${shouldTrigger ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </div>
      
      {/* Content with pull transform */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transitionDuration: pullDistance === 0 ? '200ms' : '0ms',
        }}
      >
        {children}
      </div>
    </div>
  );
};
