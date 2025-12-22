import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Timer, Sparkles, X, Zap, Trophy, Flame } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

export const DemoBanner = () => {
  const { isDemoMode, demoTimeRemaining, demoStats, endDemo } = useDemo();

  if (!isDemoMode) return null;

  const minutes = Math.floor(demoTimeRemaining / 60);
  const seconds = demoTimeRemaining % 60;
  const isLowTime = demoTimeRemaining < 300; // Less than 5 minutes

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[60] px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 ${
        isLowTime 
          ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white animate-pulse" 
          : "bg-gradient-to-r from-primary via-purple-500 to-cyan-500 text-white"
      }`}
    >
      <div className="flex items-center gap-3 text-sm font-medium">
        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Timer className="w-3.5 h-3.5" />
          <span className="font-mono font-bold">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>

        {/* Stats - visible on larger screens */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>{demoStats.totalXP} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-yellow-300" />
            <span>Lvl {demoStats.currentLevel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-300" />
            <span>{demoStats.currentStreak} day streak</span>
          </div>
        </div>

        {/* Message */}
        <span className="hidden lg:inline">
          {isLowTime 
            ? "⚡ Demo ending soon! Sign up to keep your progress" 
            : "✨ Exploring Schedulr — sign up to save your work!"}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Link to="/register">
          <Button 
            size="sm" 
            variant="secondary"
            className={`gap-1 text-xs font-semibold ${isLowTime ? "animate-bounce" : ""}`}
          >
            <Sparkles className="w-3 h-3" />
            Sign Up Free
          </Button>
        </Link>
        <button 
          onClick={endDemo}
          className="p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Exit demo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
