import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const AdminBadge = ({ size = "md", className }: AdminBadgeProps) => {
  return (
    <div
      className={cn(
        "rounded-full bg-primary flex items-center justify-center flex-shrink-0",
        sizeClasses[size],
        className
      )}
      title="Admin"
    >
      <Shield className={cn("text-white", size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-4 h-4")} />
    </div>
  );
};

export default AdminBadge;
