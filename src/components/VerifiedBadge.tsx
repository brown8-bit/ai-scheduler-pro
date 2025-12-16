import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

const checkSizes = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-4 h-4",
};

const VerifiedBadge = ({ size = "md", className }: VerifiedBadgeProps) => {
  return (
    <div
      className={cn(
        "rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0",
        sizeClasses[size],
        className
      )}
    >
      <Check className={cn("text-white stroke-[3]", checkSizes[size])} />
    </div>
  );
};

export default VerifiedBadge;
