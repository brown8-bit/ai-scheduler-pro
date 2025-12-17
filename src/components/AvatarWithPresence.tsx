import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { cn } from "@/lib/utils";

interface AvatarWithPresenceProps {
  userId: string;
  avatarUrl?: string | null;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showPresence?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const indicatorPosition = {
  sm: "bottom-0 right-0",
  md: "bottom-0 right-0",
  lg: "bottom-0 right-0",
};

export const AvatarWithPresence = ({
  userId,
  avatarUrl,
  displayName = "",
  size = "md",
  className,
  showPresence = true,
}: AvatarWithPresenceProps) => {
  const { isUserOnline } = usePresenceContext();
  const isOnline = isUserOnline(userId);
  const initial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar className={cn(sizeClasses[size], "cursor-pointer")}>
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initial}
        </AvatarFallback>
      </Avatar>
      {showPresence && (
        <PresenceIndicator 
          isOnline={isOnline} 
          size={size === "lg" ? "md" : "sm"} 
          className={indicatorPosition[size]} 
        />
      )}
    </div>
  );
};
