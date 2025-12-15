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
      <defs>
        <linearGradient
          id="schedulrLogoGradient"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>

      {/* White outer border */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="hsl(var(--background))" />

      {/* Orange rounded square with subtle 3D gradient */}
      <rect x="6" y="6" width="52" height="52" rx="12" fill="url(#schedulrLogoGradient)" />

      {/* 12 */}
      <text
        x="32"
        y="18"
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, sans-serif"
      >
        12
      </text>

      {/* 3 */}
      <text
        x="48"
        y="35"
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, sans-serif"
      >
        3
      </text>

      {/* 6 */}
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, sans-serif"
      >
        6
      </text>

      {/* 9 */}
      <text
        x="16"
        y="35"
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill="hsl(var(--primary-foreground))"
        fontFamily="system-ui, sans-serif"
      >
        9
      </text>

      {/* Single clock hand pointing toward 12 but not touching */}
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="22"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle
        cx="32"
        cy="32"
        r="1.8"
        fill="hsl(var(--primary-foreground))"
      />

      {/* Smile */}
      <path
        d="M24 42 Q32 48 40 42"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
