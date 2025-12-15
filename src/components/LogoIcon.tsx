import type { FC } from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
}

// Simple Schedulr logo: orange rounded square, 4 numbers, single hand at 12, smile
export const LogoIcon: FC<LogoIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Schedulr logo"
      className={cn("shrink-0", className)}
    >
      {/* White border */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="white" />
      
      {/* Orange square */}
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#f97316" />

      {/* 12 */}
      <text x="32" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui, sans-serif">12</text>
      
      {/* 3 */}
      <text x="48" y="35" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui, sans-serif">3</text>
      
      {/* 6 */}
      <text x="32" y="52" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui, sans-serif">6</text>
      
      {/* 9 */}
      <text x="16" y="35" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui, sans-serif">9</text>

      {/* Single clock hand pointing at 12 */}
      <line x1="32" y1="32" x2="32" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* Smile */}
      <path d="M24 42 Q32 48 40 42" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};
