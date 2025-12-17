import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PresenceIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  lastSeen?: string | null;
}

export const PresenceIndicator = ({ 
  isOnline, 
  size = "md",
  className,
  lastSeen
}: PresenceIndicatorProps) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const getStatusText = () => {
    if (isOnline) return "Online";
    if (lastSeen) {
      return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
    }
    return "Offline";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "rounded-full border-2 border-background absolute cursor-pointer",
              sizeClasses[size],
              isOnline 
                ? "bg-green-500" 
                : "bg-gray-400",
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {getStatusText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
