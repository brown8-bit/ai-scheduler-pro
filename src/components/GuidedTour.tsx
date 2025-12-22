import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles, MessageSquare, Calendar, Target, BarChart3, Users, ListTodo, Timer, Award, Mic, BookOpen, FileText, Settings, MapPin, Lightbulb, Play, ArrowRight } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  tip?: string;
  highlight?: string;
}

// Limited tour for demo users (non-signed up) - Core features only
const demoTourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Your Command Center",
    description: "Everything at a glance — upcoming events, tasks, and your daily progress. This is where your productive day begins.",
    icon: BarChart3,
    route: "/dashboard",
    tip: "Try clicking on any card to dive deeper",
    highlight: "Quick stats show your productivity at a glance"
  },
  {
    id: "chat",
    title: "Meet Scheddy — Your AI Assistant",
    description: "Just type naturally! Say things like 'Schedule a meeting tomorrow at 2pm' or 'What's on my calendar today?' — Scheddy handles the rest.",
    icon: MessageSquare,
    route: "/chat",
    tip: "Try: 'Add a workout session for Friday at 6pm'",
    highlight: "Unlimited prompts in demo mode!"
  },
  {
    id: "calendar",
    title: "Visual Calendar",
    description: "See your schedule beautifully laid out. Click any day to add events, or just explore your upcoming week.",
    icon: Calendar,
    route: "/calendar",
    tip: "Click on any empty slot to quickly add an event",
    highlight: "Drag events to reschedule them"
  }
];

// Full tour for signed-up users - Complete app walkthrough
const fullTourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Welcome to Your Dashboard",
    description: "Your personalized home base. Quick stats, upcoming events, habits, and everything you need to start your day productively.",
    icon: BarChart3,
    route: "/dashboard",
    tip: "Complete daily habits to build streaks and earn XP",
    highlight: "Your productivity score updates in real-time"
  },
  {
    id: "chat",
    title: "AI Scheduling Assistant",
    description: "Scheddy understands natural language. Schedule meetings, set reminders, get suggestions — just ask!",
    icon: MessageSquare,
    route: "/chat",
    tip: "Try: 'Block 2 hours for deep work tomorrow morning'",
    highlight: "Attach images for visual context"
  },
  {
    id: "calendar",
    title: "Visual Calendar",
    description: "Your schedule, beautifully visualized. Drag to reschedule, click to add, and stay on top of everything.",
    icon: Calendar,
    route: "/calendar",
    tip: "Use category colors to organize different event types",
    highlight: "Syncs with Google Calendar"
  },
  {
    id: "tasks",
    title: "Task Management",
    description: "Track all your to-dos with priorities, due dates, and satisfying completion animations.",
    icon: ListTodo,
    route: "/tasks",
    tip: "Set priorities to focus on what matters most",
    highlight: "Earn XP for completing tasks"
  },
  {
    id: "focus",
    title: "Focus Blocks",
    description: "Protect your deep work time. Block dedicated hours where no meetings can interrupt your flow.",
    icon: Target,
    route: "/focus-blocks",
    tip: "Schedule recurring blocks for consistent productivity",
    highlight: "Your calendar respects focus time"
  },
  {
    id: "timer",
    title: "Pomodoro Timer",
    description: "Work in focused bursts with the proven Pomodoro technique. Track sessions and boost your concentration.",
    icon: Timer,
    route: "/timer",
    tip: "Link sessions to specific tasks for better tracking",
    highlight: "Customizable work and break durations"
  },
  {
    id: "templates",
    title: "Event Templates",
    description: "Create reusable templates for recurring events. One click to add your standard meetings, workouts, or study sessions.",
    icon: BookOpen,
    route: "/templates",
    tip: "Create templates for your most common activities",
    highlight: "Save hours of repetitive scheduling"
  },
  {
    id: "achievements",
    title: "Gamification & Achievements",
    description: "Turn productivity into a game! Earn XP, unlock badges, level up, and celebrate your progress.",
    icon: Award,
    route: "/achievements",
    tip: "Check daily for new challenges",
    highlight: "Compete on the leaderboard"
  },
  {
    id: "community",
    title: "Creator Community",
    description: "Connect with fellow creators. Share wins, get inspired, and stay motivated together.",
    icon: Users,
    route: "/community",
    tip: "Share achievements to inspire others",
    highlight: "Follow creators you admire"
  },
  {
    id: "voice-notes",
    title: "Voice Notes",
    description: "Capture ideas on the go. Record quick voice memos that you can reference later.",
    icon: Mic,
    route: "/voice-notes",
    tip: "Great for capturing ideas during commutes",
    highlight: "Auto-transcription coming soon"
  },
  {
    id: "invoices",
    title: "Invoicing",
    description: "Manage your freelance business. Create invoices, track payments, and stay organized.",
    icon: FileText,
    route: "/invoices",
    tip: "Link invoices to specific clients",
    highlight: "Professional invoice templates"
  },
  {
    id: "settings",
    title: "Personalize Your Experience",
    description: "Make Schedulr yours. Themes, notifications, calendar connections, and more.",
    icon: Settings,
    route: "/settings",
    tip: "Connect your Google Calendar for two-way sync",
    highlight: "Dark mode looks amazing"
  }
];

export const GuidedTour = () => {
  const { user } = useAuth();
  const { isDemoMode, isTourActive, currentTourStep, setTourActive, setCurrentTourStep } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Use full tour for signed-up users, demo tour for non-signed-up
  const tourSteps = user ? fullTourSteps : demoTourSteps;
  
  const currentStep = tourSteps[currentTourStep];
  const isLastStep = currentTourStep === tourSteps.length - 1;
  const isFirstStep = currentTourStep === 0;

  // Track if user navigates away from the tour step (exploring freely)
  useEffect(() => {
    if (isTourActive && currentStep && location.pathname !== currentStep.route) {
      setHasInteracted(true);
    }
  }, [location.pathname, isTourActive, currentStep]);

  // Reset to first step if tour steps change (e.g., user signs in)
  useEffect(() => {
    if (currentTourStep >= tourSteps.length) {
      setCurrentTourStep(0);
    }
  }, [tourSteps.length, currentTourStep, setCurrentTourStep]);

  if (!isTourActive) return null;
  if (!isDemoMode && !user) return null;

  const handleNext = () => {
    setHasInteracted(false);
    if (isLastStep) {
      setTourActive(false);
    } else {
      const nextStep = tourSteps[currentTourStep + 1];
      setCurrentTourStep(currentTourStep + 1);
      if (nextStep) {
        navigate(nextStep.route);
      }
    }
  };

  const handlePrev = () => {
    setHasInteracted(false);
    if (!isFirstStep) {
      const prevStep = tourSteps[currentTourStep - 1];
      setCurrentTourStep(currentTourStep - 1);
      if (prevStep) {
        navigate(prevStep.route);
      }
    }
  };

  const handleSkip = () => {
    setTourActive(false);
  };

  const handleGoToStep = () => {
    if (currentStep) {
      navigate(currentStep.route);
      setHasInteracted(false);
    }
  };

  const handleJumpToStep = (index: number) => {
    setHasInteracted(false);
    setCurrentTourStep(index);
    const step = tourSteps[index];
    if (step) {
      navigate(step.route);
    }
  };

  const StepIcon = currentStep?.icon || Sparkles;
  const isOnCorrectRoute = currentStep && location.pathname === currentStep.route;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-[70] p-3 rounded-full bg-primary shadow-lg hover:scale-110 transition-transform group"
      >
        <div className="relative">
          <MapPin className="w-5 h-5 text-primary-foreground" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border">
          Continue tour
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-[70] animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-primary via-primary to-primary/80 px-4 py-3">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10">
                <StepIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-primary-foreground/70 uppercase tracking-wider">
                    {!user ? "Demo Tour" : "Feature Tour"}
                  </span>
                  <span className="text-[10px] text-primary-foreground/50">•</span>
                  <span className="text-[10px] font-medium text-primary-foreground/70">
                    {currentTourStep + 1}/{tourSteps.length}
                  </span>
                </div>
                <h3 className="font-bold text-primary-foreground text-base leading-tight">{currentStep?.title}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                aria-label="Minimize tour"
                title="Minimize"
              >
                <ChevronRight className="w-4 h-4 text-primary-foreground" />
              </button>
              <button
                onClick={handleSkip}
                className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                aria-label="Close tour"
                title="End tour"
              >
                <X className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{currentStep?.description}</p>
          
          {/* Helpful tip */}
          {currentStep?.tip && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pro tip</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{currentStep.tip}</p>
              </div>
            </div>
          )}

          {/* Feature highlight */}
          {currentStep?.highlight && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
              <Sparkles className="w-3 h-3 text-primary" />
              <p className="text-xs text-primary font-medium">{currentStep.highlight}</p>
            </div>
          )}

          {/* Navigation hint when user explored away */}
          {!isOnCorrectRoute && hasInteracted && (
            <button
              onClick={handleGoToStep}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <Play className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Go to {currentStep?.title}
              </span>
            </button>
          )}

          {/* Sign up prompt for demo users on last step */}
          {!user && isLastStep && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎉</span>
                <p className="text-sm font-semibold text-foreground">You've seen the highlights!</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Sign up free to unlock all features, save your data, and get personalized AI scheduling.
              </p>
              <Button size="sm" className="w-full gap-2" onClick={() => navigate('/register')}>
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Progress dots - clickable for freedom */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {tourSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleJumpToStep(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 hover:scale-110",
                  index === currentTourStep
                    ? "w-8 bg-primary"
                    : index < currentTourStep
                    ? "w-2 bg-primary/50 hover:bg-primary/70"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                title={step.title}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground text-xs"
            >
              {!user ? "Explore freely" : "End tour"}
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            {isLastStep ? (user ? "Finish" : "Get Started") : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Freedom reminder */}
        <div className="px-4 pb-3">
          <p className="text-[10px] text-center text-muted-foreground/60">
            Feel free to explore! The tour will wait for you. 🚀
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
