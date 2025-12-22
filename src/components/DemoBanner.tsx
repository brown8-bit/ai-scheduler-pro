import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Timer, Sparkles, X, MapPin } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

export const DemoBanner = () => {
  const { isDemoMode, demoTimeRemaining, endDemo, isTourActive, setTourActive } = useDemo();

  if (!isDemoMode) return null;

  const minutes = Math.floor(demoTimeRemaining / 60);
  const seconds = demoTimeRemaining % 60;
  const isLowTime = demoTimeRemaining < 300; // Less than 5 minutes

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[60] px-2 sm:px-3 py-2 ${
        isLowTime 
          ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white" 
          : "bg-gradient-to-r from-primary via-purple-500 to-cyan-500 text-white"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between gap-2">
        {/* Left side - Timer and tour */}
        <div className="flex items-center gap-2 text-sm font-medium min-w-0">
          {/* Timer */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full shrink-0">
            <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="font-mono font-bold text-xs sm:text-sm">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>

          {/* Resume tour button if tour is not active */}
          {!isTourActive && (
            <button
              onClick={() => setTourActive(true)}
              className="flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full hover:bg-white/30 transition-colors touch-manipulation shrink-0"
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-xs font-medium hidden xs:inline">Resume Tour</span>
            </button>
          )}

          {/* Message - hidden on very small screens */}
          <span className="hidden md:inline truncate text-sm">
            {isLowTime 
              ? "⚡ Demo ending soon! Sign up to keep your progress" 
              : "✨ Full access — explore everything freely!"}
          </span>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link to="/register">
            <Button 
              size="sm" 
              variant="secondary"
              className={`gap-1 text-xs font-semibold px-2 sm:px-3 h-8 touch-manipulation ${isLowTime ? "animate-bounce" : ""}`}
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden xs:inline">Sign Up</span>
              <span className="xs:hidden">Join</span>
            </Button>
          </Link>
          <button 
            onClick={endDemo}
            className="p-1.5 sm:p-2 rounded hover:bg-white/20 transition-colors touch-manipulation"
            aria-label="Exit demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
