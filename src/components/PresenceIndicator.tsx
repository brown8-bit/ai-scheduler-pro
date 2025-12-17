import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PresenceIndicator = ({ 
  isOnline, 
  size = "md",
  className 
}: PresenceIndicatorProps) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={cn(
        "rounded-full border-2 border-background absolute",
        sizeClasses[size],
        isOnline 
          ? "bg-green-500" 
          : "bg-gray-400",
        className
      )}
      title={isOnline ? "Online" : "Offline"}
    />
  );
};
