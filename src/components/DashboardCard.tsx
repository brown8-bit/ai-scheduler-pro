import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description?: string;
  time?: string;
  icon?: LucideIcon;
  className?: string;
  variant?: "default" | "highlight";
}

const DashboardCard = ({ 
  title, 
  description, 
  time, 
  icon: Icon,
  className,
  variant = "default"
}: DashboardCardProps) => {
  return (
    <div 
      className={cn(
        "p-6 rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        variant === "highlight" && "border-primary/20 bg-primary/5",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            variant === "highlight" ? "gradient-primary" : "bg-secondary"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              variant === "highlight" ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-card-foreground truncate">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {description}
            </p>
          )}
          {time && (
            <p className="text-primary font-medium mt-2 text-sm">
              {time}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
