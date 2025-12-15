import type { FC } from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
}

// Schedulr logo: orange rounded square, 4 numbers, single hand at 12, smile
export const LogoIcon: FC<LogoIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Schedulr logo"
      className={cn("shrink-0", className)}
    >
      {/* White background/border */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="18"
        fill="white"
      />
      
      {/* Orange background */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="16"
        fill="hsl(var(--primary))"
      />

      {/* Numbers */}
      <text
        x="32"
        y="18"
        textAnchor="middle"
        fontSize="10"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
      >
        12
      </text>
      <text
        x="48"
        y="34"
        textAnchor="middle"
        fontSize="10"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
      >
        3
      </text>
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontSize="10"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
      >
        6
      </text>
      <text
        x="16"
        y="34"
        textAnchor="middle"
        fontSize="10"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
      >
        9
      </text>

      {/* Single clock hand pointing at 12 */}
      <line
        x1="32"
        y1="30"
        x2="32"
        y2="18"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Smile */}
      <path
        d="M24 40 Q32 46 40 40"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};
