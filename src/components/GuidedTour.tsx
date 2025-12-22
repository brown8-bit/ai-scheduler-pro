import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles, MessageSquare, Calendar, Target, BarChart3, Users, ListTodo, Timer, Award, Mic, BookOpen, FileText, Settings } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  action?: string;
}

// Limited tour for demo users (non-signed up)
const demoTourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your home base! View your upcoming events, tasks, and quick stats at a glance.",
    icon: BarChart3,
    route: "/dashboard",
    action: "Check out your daily overview"
  },
  {
    id: "chat",
    title: "AI Scheduling Assistant",
    description: "Meet Scheddy! Just type what you want to schedule like 'Add a meeting tomorrow at 2pm' and the AI handles the rest.",
    icon: MessageSquare,
    route: "/chat",
    action: "Try asking Scheddy to schedule something"
  },
  {
    id: "calendar",
    title: "Visual Calendar",
    description: "See all your events in a beautiful calendar view. Click any day to add events or drag to reschedule.",
    icon: Calendar,
    route: "/calendar",
    action: "Click on a day to add an event"
  }
];

// Full tour for signed-up users
const fullTourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "Welcome! This is your home base with quick stats, upcoming events, and daily habits all in one place.",
    icon: BarChart3,
    route: "/dashboard",
    action: "Explore your personalized dashboard"
  },
  {
    id: "chat",
    title: "AI Scheduling Assistant",
    description: "Meet Scheddy! Use natural language to schedule events, set reminders, and manage your time effortlessly.",
    icon: MessageSquare,
    route: "/chat",
    action: "Ask Scheddy to schedule something"
  },
  {
    id: "calendar",
    title: "Visual Calendar",
    description: "Your beautiful calendar view. Click any day to add events, drag to reschedule, and see your week at a glance.",
    icon: Calendar,
    route: "/calendar",
    action: "Click on a day to add an event"
  },
  {
    id: "tasks",
    title: "Task Management",
    description: "Keep track of all your to-dos with priorities, due dates, and completion tracking. Stay on top of everything!",
    icon: ListTodo,
    route: "/tasks",
    action: "Add your first task"
  },
  {
    id: "focus",
    title: "Focus Blocks",
    description: "Block dedicated time for deep work. Protect your productive hours from meetings and distractions.",
    icon: Target,
    route: "/focus-blocks",
    action: "Create a focus block"
  },
  {
    id: "timer",
    title: "Pomodoro Timer",
    description: "Use the Pomodoro technique to work in focused bursts. Track your sessions and boost productivity.",
    icon: Timer,
    route: "/timer",
    action: "Start a focus session"
  },
  {
    id: "templates",
    title: "Event Templates",
    description: "Create reusable templates for common events. Save time by quickly adding meetings, workouts, or study sessions.",
    icon: BookOpen,
    route: "/templates",
    action: "Create a template"
  },
  {
    id: "achievements",
    title: "Achievements & Gamification",
    description: "Earn XP, unlock badges, and level up as you complete tasks and maintain streaks. Make productivity fun!",
    icon: Award,
    route: "/achievements",
    action: "View your achievements"
  },
  {
    id: "community",
    title: "Creator Community",
    description: "Connect with other creators! Share achievements, get inspired, and stay motivated together.",
    icon: Users,
    route: "/community",
    action: "Explore the community"
  },
  {
    id: "voice-notes",
    title: "Voice Notes",
    description: "Record quick voice memos and notes on the go. Never forget an idea again!",
    icon: Mic,
    route: "/voice-notes",
    action: "Record a voice note"
  },
  {
    id: "invoices",
    title: "Invoicing",
    description: "Create and manage invoices for your clients. Track payments and stay organized.",
    icon: FileText,
    route: "/invoices",
    action: "Create an invoice"
  },
  {
    id: "settings",
    title: "Settings",
    description: "Customize your experience! Change themes, notification preferences, and connect your calendars.",
    icon: Settings,
    route: "/settings",
    action: "Customize your settings"
  }
];

export const GuidedTour = () => {
  const { user } = useAuth();
  const { isDemoMode, isTourActive, currentTourStep, setTourActive, setCurrentTourStep } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  // Use full tour for signed-up users, demo tour for non-signed-up
  const tourSteps = user ? fullTourSteps : demoTourSteps;
  
  const currentStep = tourSteps[currentTourStep];
  const isLastStep = currentTourStep === tourSteps.length - 1;
  const isFirstStep = currentTourStep === 0;

  // Navigate to step route when step changes
  useEffect(() => {
    if (isTourActive && currentStep && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentTourStep, isTourActive, currentStep]);

  // Reset to first step if tour steps change (e.g., user signs in)
  useEffect(() => {
    if (currentTourStep >= tourSteps.length) {
      setCurrentTourStep(0);
    }
  }, [tourSteps.length, currentTourStep, setCurrentTourStep]);

  if (!isTourActive) return null;
  if (!isDemoMode && !user) return null;

  const handleNext = () => {
    if (isLastStep) {
      setTourActive(false);
    } else {
      setCurrentTourStep(currentTourStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentTourStep(currentTourStep - 1);
    }
  };

  const handleSkip = () => {
    setTourActive(false);
  };

  const StepIcon = currentStep?.icon || Sparkles;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-[70] p-3 rounded-full gradient-primary shadow-lg hover:scale-110 transition-transform animate-pulse"
      >
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[70] animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="gradient-primary px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <StepIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-primary-foreground/80">
                Step {currentTourStep + 1} of {tourSteps.length}
                {!user && <span className="ml-1">(Demo)</span>}
              </p>
              <h3 className="font-semibold text-primary-foreground text-sm">{currentStep?.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors"
              aria-label="Minimize tour"
            >
              <ChevronRight className="w-4 h-4 text-primary-foreground" />
            </button>
            <button
              onClick={handleSkip}
              className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{currentStep?.description}</p>
          
          {currentStep?.action && (
            <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Try it: {currentStep.action}
              </p>
            </div>
          )}

          {/* Sign up prompt for demo users on last step */}
          {!user && isLastStep && (
            <div className="mt-3 p-3 rounded-lg bg-accent/20 border border-accent/30">
              <p className="text-xs text-foreground font-medium">
                🎉 Sign up to unlock all features and get the full tour!
              </p>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTourStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentTourStep
                    ? "w-6 bg-primary"
                    : index < currentTourStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                }`}
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip Tour
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            {isLastStep ? "Finish" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
