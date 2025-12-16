import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const VerifiedBadge = ({ size = "md", className }: VerifiedBadgeProps) => {
  return (
    <BadgeCheck 
      className={cn(
        "fill-violet-500 text-white flex-shrink-0",
        sizeClasses[size],
        className
      )}
    />
  );
};

export default VerifiedBadge;
