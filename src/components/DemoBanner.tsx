import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Timer, Sparkles, X } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

export const DemoBanner = () => {
  const { isDemoMode, demoTimeRemaining, endDemo } = useDemo();

  if (!isDemoMode) return null;

  const minutes = Math.floor(demoTimeRemaining / 60);
  const seconds = demoTimeRemaining % 60;
  const isLowTime = demoTimeRemaining < 300; // Less than 5 minutes

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[60] px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 ${
        isLowTime 
          ? "bg-destructive text-destructive-foreground" 
          : "bg-primary text-primary-foreground"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Timer className="w-4 h-4 animate-pulse" />
        <span>
          Demo Mode: {minutes}:{seconds.toString().padStart(2, "0")} remaining
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Link to="/register">
          <Button 
            size="sm" 
            variant={isLowTime ? "secondary" : "outline"}
            className={`gap-1 text-xs ${
              isLowTime 
                ? "" 
                : "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Sign Up to Save
          </Button>
        </Link>
        <button 
          onClick={endDemo}
          className="p-1 rounded hover:bg-primary-foreground/10 transition-colors"
          aria-label="Exit demo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
